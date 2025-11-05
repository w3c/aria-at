import path from 'path';
import fse from 'fs-extra';
import { spawnSync } from 'child_process';
import getReferenceForDirectory from './getReferenceForDirectory.mjs';
import getReferencesData from './getReferencesData.mjs';
import getScriptsData from './getScriptsData.mjs';
import getCollectedTestsData from './getCollectedTestsData.mjs';
import processCollectedTests from './processCollectedTests.mjs';
import { generatePatternPages, generateIndexPage } from './generateReviewPages.mjs';
import { commandsAPI as CommandsAPI } from '../../tests/resources/at-commands.mjs';
import { unescapeHTML } from './utils.mjs';

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

  fse.readdirSync(testsBuildDirectory).forEach(function (directory) {
    const testPlanDirectory = path.join(testsDirectory, directory);
    const stat = fse.statSync(testPlanDirectory);

    // Do nothing
    if (!stat.isDirectory()) return;
    if (directory === 'resources') return;

    // Will continue if TARGET_TEST_PLAN is not set
    if (TARGET_TEST_PLAN && directory !== TARGET_TEST_PLAN) return;

    // Initialize the commands API
    const testPlanBuildDirectory = path.join(testsBuildDirectory, directory);
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
    const referencesData = getReferencesData(testPlanDirectory);
    const referenceFromReferencesCSV = getReferenceForDirectory(referencesData, 'reference');
    const titleFromReferencesCSV = getReferenceForDirectory(referencesData, 'title');

    if (!referenceFromReferencesCSV) {
      // force exit if file path reference not found
      console.error(
        `'reference' value path defined in "tests/${directory}/data/references.csv" not found.`
      );
      process.exit(1);
    }
    referencesForPattern[directory] = referencesData;

    // Get test plan's data/js/*.js script files data
    const scriptsData = getScriptsData(testPlanDirectory);
    scripts.push(...scriptsData);

    // Get test plan build directory's from `test-{xx}-{testId}.html` files data
    const collectedTestsData = getCollectedTestsData(testPlanBuildDirectory, {
      referencesData,
      aria,
      htmlAam,
    });
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
      const testFilePath = path.join(testsDirectory, directory);
      // TODO: useful for determining smart-diffs

      const output = spawnSync('git', ['log', '-1', '--format="%ad"', testFilePath]);
      const lastEdited = output.stdout.toString().replace(/"/gi, '').replace('\n', '');

      tests.push({
        testNumber,
        title: titleFromReferencesCSV.value,
        name: testFullName,
        location: `/${directory}/${test}`,
        reference: `/${directory}/${path.posix.join(
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
      allTestsForPattern[directory] = tests;
    }
  });

  // Generate individual patterns' review pages
  const patterns = TARGET_TEST_PLAN ? [TARGET_TEST_PLAN] : Object.keys(allTestsForPattern);

  if (patterns.length === 0) {
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
  });

  // Generate build/index.html entry file
  generateIndexPage({
    indexTemplate,
    allTestsForPattern,
    indexFileBuildOutputPath,
    testMode: args.testMode,
  });
}
