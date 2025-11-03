import path from 'path';
import fse from 'fs-extra';
import { spawnSync } from 'child_process';
import getReferenceForDirectory from './getReferenceForDirectory.mjs';
import getReferencesData from './getReferencesData.mjs';
import getScriptsData from './getScriptsData.mjs';
import getCollectedTestsData from './getCollectedTestsData.mjs';
import processCollectedTests from './processCollectedTests.mjs';
import { generatePatternPages, generateIndexPage } from './generateReviewPages.mjs';
import { commandsAPI as CommandsAPI } from '../../resources/at-commands.mjs';
import { unescapeHTML } from './utils.mjs';

/**
 * @param {string} testsDirectory - Path to the tests directory
 * @param {string} testsBuildDirectory - Path to the tests build directory
 * @param {string|null} targetTestPlan - Specific test plan to find, or null for all
 * @returns {Array<{name: string, subfolder: string|null, subfolderName: string|null, sourcePath: string, buildPath: string}>} Array of test plan info
 */
function getAllTestPlansForReview(testsDirectory, testsBuildDirectory, targetTestPlan) {
  const testPlans = [];

  try {
    const entries = fse.readdirSync(testsDirectory, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name === 'commands.json' || entry.name === 'support.json') {
        continue;
      }

      const entryPath = path.join(testsDirectory, entry.name);

      if (entry.isDirectory()) {
        // Check if this is a test plan directory (has data subdirectory)
        const dataPath = path.join(entryPath, 'data');
        if (fse.existsSync(dataPath) && fse.statSync(dataPath).isDirectory()) {
          // This is a test plan directly in tests directory
          if (!targetTestPlan || entry.name === targetTestPlan) {
            const buildPath = path.join(testsBuildDirectory, entry.name);
            if (fse.existsSync(buildPath)) {
              testPlans.push({
                name: entry.name,
                subfolder: null,
                subfolderName: null,
                sourcePath: entryPath,
                buildPath,
              });
            }
          }
        } else {
          // This might be a subfolder containing test plans
          try {
            const subfolderEntries = fse.readdirSync(entryPath, { withFileTypes: true });
            for (const subEntry of subfolderEntries) {
              if (subEntry.isDirectory()) {
                const subEntryPath = path.join(entryPath, subEntry.name);
                const subDataPath = path.join(subEntryPath, 'data');
                if (fse.existsSync(subDataPath) && fse.statSync(subDataPath).isDirectory()) {
                  // This is a test plan in a subfolder
                  if (!targetTestPlan || subEntry.name === targetTestPlan) {
                    const buildPath = path.join(testsBuildDirectory, entry.name, subEntry.name);
                    if (fse.existsSync(buildPath)) {
                      // Try to get subfolder name from support.json
                      let subfolderName = entry.name; // Default to folder name
                      try {
                        const supportJsonPath = path.join(testsDirectory, 'support.json');
                        if (fse.existsSync(supportJsonPath)) {
                          const supportJson = JSON.parse(fse.readFileSync(supportJsonPath, 'utf8'));
                          if (supportJson.subfolders && supportJson.subfolders[entry.name]) {
                            subfolderName = supportJson.subfolders[entry.name];
                          }
                        }
                      } catch (error) {
                        // If we can't read support.json, just use the folder name
                        console.error('error.read.support.json', error);
                      }

                      testPlans.push({
                        name: subEntry.name,
                        subfolder: entry.name,
                        subfolderName,
                        sourcePath: subEntryPath,
                        buildPath,
                      });
                    }
                  }
                }
              }
            }
          } catch (error) {
            // If we can't read the subfolder, skip it
            console.error('error.read.tests.subfolder.skip', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('error.read.tests.directory', error);
  }

  return testPlans;
}

/**
 * @param {object} config
 * @param {object} config.args
 * @param {string} config.args.testplan
 * @param {boolean} config.args.testMode
 * @param {string} config.buildOutputDirectory
 * @param {string} config.testsDirectory
 */
export function createReviewPages(config) {
  const args = config?.args || {};

  // on some OSes, it seems the `npm_config_testplan` environment variable will come back as the actual variable name rather than empty if it does not exist
  const TARGET_TEST_PLAN =
    args.testplan && !args.testplan.includes('npm_config_testplan') ? args.testplan : null; // individual test plan to generate review page assets for

  // Defining files to reference
  const rootDirectory = path.resolve('.');

  const buildDirectory = config?.buildOutputDirectory ?? path.resolve('.', 'build');
  const testsDirectory = path.resolve(rootDirectory, 'tests');
  const scriptsDirectory = path.resolve(rootDirectory, 'scripts');
  const testsBuildDirectory = path.resolve(buildDirectory, 'tests');
  const reviewBuildDirectory = path.resolve(buildDirectory, 'review');

  const indexFileBuildOutputPath = path.resolve(buildDirectory, 'index.html');
  const supportFilePath = path.join(rootDirectory, 'tests', 'support.json');
  const allCommandsFilePath = path.join(rootDirectory, 'tests', 'commands.json');
  const reviewTemplateFilePath = path.resolve(
    scriptsDirectory,
    'test-reviewer',
    'review-template.mustache'
  );
  const reviewIndexTemplateFilePath = path.resolve(
    scriptsDirectory,
    'test-reviewer',
    'review-index-template.mustache'
  );

  let template = fse.readFileSync(reviewTemplateFilePath, 'utf8');
  let indexTemplate = fse.readFileSync(reviewIndexTemplateFilePath, 'utf8');

  // create directories if not exists
  fse.existsSync(reviewBuildDirectory) || fse.mkdirSync(reviewBuildDirectory);

  const support = JSON.parse(fse.readFileSync(supportFilePath));
  const allCommands = JSON.parse(fse.readFileSync(allCommandsFilePath));

  const allTestsForPattern = {};
  const referencesForPattern = {};
  const scripts = [];
  const allATKeys = support.ats.map(at => at.key);

  // Get all test plans including those in subfolders
  const allTestPlans = getAllTestPlansForReview(
    testsDirectory,
    testsBuildDirectory,
    TARGET_TEST_PLAN
  );

  allTestPlans.forEach(function (testPlan) {
    const testPlanDirectory = testPlan.sourcePath;
    const testPlanBuildDirectory = testPlan.buildPath;

    // Initialize the commands API
    const testPlanCommandsJSONFile = path.join(testPlanBuildDirectory, 'commands.json');
    const testPlanCommands = JSON.parse(fse.readFileSync(testPlanCommandsJSONFile));
    const commandsAPI = new CommandsAPI(testPlanCommands, support, allCommands);

    const tests = [];
    const collectedTests = [];

    const {
      references: { aria, htmlAam },
      testPlanStrings: { ariaSpecsPreface, openExampleInstruction },
    } = support;

    // Get test plan's references.csv data
    const referencesData = getReferencesData(testPlanDirectory, aria, htmlAam);
    const referenceFromReferencesCSV = getReferenceForDirectory(referencesData, 'reference');
    const titleFromReferencesCSV = getReferenceForDirectory(referencesData, 'title');

    if (!referenceFromReferencesCSV) {
      // force exit if file path reference not found
      const testPlanPath = testPlan.subfolder
        ? `tests/${testPlan.subfolder}/${testPlan.name}`
        : `tests/${testPlan.name}`;
      console.error(
        `'reference' value path defined in "${testPlanPath}/data/references.csv" not found.`
      );
      process.exit(1);
    }
    referencesForPattern[testPlan.name] = referencesData;

    // Get test plan's data/js/*.js script files data
    const scriptsData = getScriptsData(testPlanDirectory);
    scripts.push(...scriptsData);

    // Get test plan build directory's from `test-{xx}-{testId}.html` files data
    const collectedTestsData = getCollectedTestsData(testPlanBuildDirectory);
    collectedTests.push(...collectedTestsData);

    collectedTests.forEach(({ test, testFullName, helpLinks, ...testData }) => {
      const testNumber = tests.length + 1;
      // TODO: Using a property unique to the v2 test format to identify if v2; consider a metadata property in the
      //  future if newer versions are to be supported
      const isV2 = !!testData.commandsInfo;
      const task = testData.task;

      const helpLinksTitle = ariaSpecsPreface;
      const helpLinksExist = !!helpLinks.length;

      // This is temporary while transitioning from lists to strings
      const mode = typeof testData.mode === 'string' ? testData.mode : testData.mode[0];
      const atTests = [];

      const openExampleInstructions =
        unescapeHTML(openExampleInstruction) + ' ' + testData.setup_script_description + '.';

      // TODO: applies_to strings are not standardized yet.
      let allRelevantATs =
        testData.applies_to[0].toLowerCase() === 'desktop screen readers' ||
        testData.applies_to[0].toLowerCase() === 'screen readers'
          ? allATKeys
          : testData.applies_to;
      // To remove potential duplicates
      allRelevantATs = [...new Set(allRelevantATs)];

      for (const atKey of allRelevantATs.map(a => a.toLowerCase())) {
        const {
          at,
          userInstruction,
          modeInstructions,
          commandsValuesForInstructions,
          defaultConfigurationInstructions,
          assertionsForCommandsInstructions,
        } = processCollectedTests({
          mode,
          task,
          atKey,
          testNumber,
          commandsAPI,
          collectedTest: testData,
        });

        atTests.push({
          atName: at.name,
          atKey: at.key,
          userInstruction,
          modeInstructions,
          openExampleInstructions,
          commandsValuesForInstructions,
          defaultConfigurationInstructions,
          assertionsForCommandsInstructions,
        });
      }

      // Create the test review pages
      const testFilePath = testPlanDirectory;
      // TODO: useful for determining smart-diffs

      const output = spawnSync('git', ['log', '-1', '--format="%ad"', testFilePath]);
      const lastEdited = output.stdout.toString().replace(/"/gi, '').replace('\n', '');

      // Build path prefix including subfolder if present
      const testPlanPathPrefix = testPlan.subfolder
        ? `${testPlan.subfolder}/${testPlan.name}`
        : testPlan.name;

      tests.push({
        testNumber,
        title: titleFromReferencesCSV.value,
        name: testFullName,
        location: `/${testPlanPathPrefix}/${test}`,
        reference: `/${testPlanPathPrefix}/${path.posix.join(
          path.dirname(referenceFromReferencesCSV.value),
          path.basename(referenceFromReferencesCSV.value, '.html')
        )}${testData.setupTestPage ? `.${testData.setupTestPage}` : ''}.html`,
        allRelevantATsFormatted: allRelevantATs.join(', '),
        allRelevantATsSpaceSeparated: allRelevantATs.join(' '),
        allRelevantATs: allRelevantATs.map(each => {
          const at = support.ats.find(at => at.key === each);
          return {
            key: at.key,
            name: at.name,
          };
        }),
        setupScriptName: testData.setupTestPage,
        task,
        mode,
        atTests,
        helpLinks,
        helpLinksTitle,
        helpLinksExist,
        lastEdited: args.testMode ? null : lastEdited,
        isV2,
      });
    });

    if (tests.length) {
      const patternKey = testPlan.subfolder
        ? `${testPlan.subfolder}/${testPlan.name}`
        : testPlan.name;
      allTestsForPattern[patternKey] = tests;

      if (!allTestsForPattern.info) allTestsForPattern.info = {};
      allTestsForPattern.info[patternKey] = {
        subfolder: testPlan.subfolder,
        name: testPlan.name,
      };
    }
  });

  // Generate individual patterns' review pages
  const patterns = TARGET_TEST_PLAN
    ? Object.keys(allTestsForPattern).filter(key => {
        if (key === 'info') return false;
        const info = allTestsForPattern.info?.[key];
        return (info?.name || key) === TARGET_TEST_PLAN;
      })
    : Object.keys(allTestsForPattern).filter(key => key !== 'info');

  if (TARGET_TEST_PLAN && patterns.length === 0) {
    console.error(`Unable to find valid test plan(s): ${TARGET_TEST_PLAN}`);
    process.exit(1);
  }

  generatePatternPages({
    template,
    patterns,
    allTestsForPattern,
    referencesForPattern,
    reviewBuildDirectory,
    atOptions: support.ats,
    setupScripts: scripts,
    testPlansInfo: allTestsForPattern.info || {},
  });

  // Generate build/index.html entry file
  generateIndexPage({
    indexTemplate,
    allTestsForPattern,
    indexFileBuildOutputPath,
    testMode: args.testMode,
  });
}
