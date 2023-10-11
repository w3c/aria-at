import path from 'path';
import fse from 'fs-extra';
import { spawnSync } from 'child_process';
import np from 'node-html-parser';
import mustache from 'mustache';
import minimist from 'minimist';
import { commandsAPI as CommandsAPI } from '../tests/resources/at-commands.mjs';

const args = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    t: 'testplan',
  },
});

if (args.help) {
  console.log(`Default use:
  No arguments:
    Generate review pages.
  Arguments:
    -h, --help
       Show this message.
    -t, --testplan
       Generate review page for an individual test plan directory. eg. --testplan=checkbox
`);
  process.exit();
}

// on some OSes, it seems the `npm_config_testplan` environment variable will come back as the actual variable name rather than empty if it does not exist
const TARGET_TEST_PLAN =
  args.testplan && !args.testplan.includes('npm_config_testplan') ? args.testplan : null; // individual test plan to generate review page assets for

// folders and file paths setup
const buildDirectory = path.resolve('.', 'build');
const testsDirectory = path.resolve('.', 'tests');
const scriptsDirectory = path.resolve('.', 'scripts');
const testsBuildDirectory = path.resolve(buildDirectory, 'tests');
const reviewBuildDirectory = path.resolve(buildDirectory, 'review');

const indexFileBuildOutputPath = path.resolve(buildDirectory, 'index.html');
const supportFilePath = path.join(testsDirectory, 'support.json');
const allCommandsFilePath = path.join(testsDirectory, 'commands.json');
const reviewTemplateFilePath = path.resolve(scriptsDirectory, 'review-template.mustache');
const reviewIndexTemplateFilePath = path.resolve(
  scriptsDirectory,
  'review-index-template.mustache'
);

// create directories if not exists
fse.existsSync(reviewBuildDirectory) || fse.mkdirSync(reviewBuildDirectory);

const allTestsForPattern = {};
const referencesForPattern = {};
const support = JSON.parse(fse.readFileSync(supportFilePath));
const allCommands = JSON.parse(fse.readFileSync(allCommandsFilePath));

let allATKeys = [];
support.ats.forEach(at => {
  allATKeys.push(at.key);
});

const scripts = [];

const getPriorityString = function (priority) {
  priority = parseInt(priority);
  if (priority === 1) {
    return 'MUST';
  } else if (priority === 2) {
    return 'SHOULD';
  } else if (priority === 3) {
    return 'MAY';
  }
  return '';
};

const getReferenceForDirectory = (references, refId) => {
  const { type, value, linkText } = references.find(el => el.refId === refId) || {};
  return { type, value, linkText };
};

const unescapeHTML = string =>
  string.replace(
    /&amp;|&lt;|&gt;|&#39;|&quot;/g,
    tag =>
      ({
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&#39;': "'",
        '&quot;': '"',
      }[tag] || tag)
  );

fse.readdirSync(testsBuildDirectory).forEach(function (directory) {
  const testPlanDirectory = path.join(testsDirectory, directory);
  const testPlanBuildDirectory = path.join(testsBuildDirectory, directory);
  const stat = fse.statSync(testPlanDirectory);

  if (
    stat.isDirectory() &&
    directory !== 'resources' &&
    (TARGET_TEST_PLAN ? directory === TARGET_TEST_PLAN : true)
  ) {
    // Initialize the commands API
    const testPlanCommandsJSONFile = path.join(testPlanBuildDirectory, 'commands.json');
    const testPlanCommands = JSON.parse(fse.readFileSync(testPlanCommandsJSONFile));
    const commandsAPI = new CommandsAPI(testPlanCommands, support, allCommands);

    const tests = [];
    const collectedTestsData = [];

    const referencesCsv = fse.readFileSync(
      path.join(testPlanDirectory, 'data', 'references.csv'),
      'UTF-8'
    );
    const lines = referencesCsv.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    const referencesCsvData = lines.slice(1).map(line => line.split(','));

    let referencesData = referencesCsvData.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    const {
      references: { aria, htmlAam },
      testPlanStrings: {
        ariaSpecsPreface,
        openExampleInstruction,
        commandListPreface,
        commandListSettingsPreface,
        settingInstructionsPreface,
        assertionResponseQuestion,
      },
    } = support;
    referencesData = referencesData.map(
      ({ refId: _refId, type: _type, value: _value, linkText: _linkText }) => {
        let refId = _refId?.trim();
        let type = _type?.trim();
        let value = _value?.trim();
        let linkText = _linkText?.trim();

        if (type === 'aria') {
          value = `${aria.baseUrl}${aria.fragmentIds[value]}`;
          linkText = `${linkText} ${aria.linkText}`;
        }

        if (type === 'htmlAam') {
          value = `${htmlAam.baseUrl}${htmlAam.fragmentIds[value]}`;
          linkText = `${linkText} ${htmlAam.linkText}`;
        }

        return { refId, type, value, linkText };
      }
    );

    const reference = getReferenceForDirectory(referencesData, 'reference');
    const title = getReferenceForDirectory(referencesData, 'title');

    if (!reference) {
      // force exit if file path reference not found
      console.error(
        `ERROR: 'reference' value path defined in "tests/${directory}/data/references.csv" not found.`
      );
      process.exit(1);
    }

    referencesForPattern[directory] = referencesData;

    const scriptsPath = path.join(testPlanDirectory, 'data', 'js');
    fse.readdirSync(scriptsPath).forEach(function (scriptFile) {
      let script = '';
      try {
        const data = fse.readFileSync(path.join(scriptsPath, scriptFile), 'UTF-8');
        const lines = data.split(/\r?\n/);
        lines.forEach(line => {
          if (line.trim().length) script += '\t' + line.trim() + '\n';
        });
      } catch (err) {
        console.error(err);
      }
      scripts.push(`\t${scriptFile.split('.js')[0]}: function(testPageDocument){\n${script}}`);
    });

    fse.readdirSync(testPlanBuildDirectory).forEach(function (test) {
      if (
        path.extname(test) === '.html' &&
        !/\.collected\.html$/.test(test) &&
        path.basename(test) !== 'index.html'
      ) {
        const testFile = path.join(testsBuildDirectory, directory, test);
        const root = np.parse(fse.readFileSync(testFile, 'utf8'), { script: true });

        // Get testData from test-review-{presentationNumber}-{testId}-{modes}.json
        const testData = JSON.parse(
          fse.readFileSync(
            path.join(testPlanBuildDirectory, path.parse(test).name + '.json'),
            'utf8'
          )
        );

        // Get metadata help links
        const testFullName = root.querySelector('title').innerHTML;
        const helpLinks = [];
        for (let link of root.querySelectorAll('link')) {
          if (link.attributes.rel === 'help') {
            let href = link.attributes.href;
            // V2
            let text = link.attributes.title;

            // V1
            if (!text) {
              if (href.indexOf('#') >= 0) {
                text = `ARIA specification: ${href.split('#')[1]}`;
              } else {
                text = `APG example: ${href.split('examples/')[1]}`;
              }
            }

            helpLinks.push({
              link: href,
              text: text,
            });
          }
        }

        collectedTestsData.push({ ...testData, test, testFullName, helpLinks });
      }
    });

    collectedTestsData
      .sort((a, b) => {
        const commandsInfoA = a.commandsInfo;
        const commandsInfoB = b.commandsInfo;

        // The whole number will always be the same in the collection
        function extractPresentationNumber(data) {
          let presentationNumber;

          // Loop through the keys in testData
          for (const key in data) {
            // Check if the key has data
            if (data[key].length > 0) {
              // Extract presentation number from the first item in the array
              presentationNumber = parseInt(data[key][0].presentationNumber);
            }
          }

          return presentationNumber;
        }

        const wholeNumberA = extractPresentationNumber(commandsInfoA);
        const wholeNumberB = extractPresentationNumber(commandsInfoB);

        return wholeNumberA - wholeNumberB;
      })
      .forEach(({ test, testFullName, helpLinks, ...testData }) => {
        const testNumber = tests.length + 1;

        const helpLinksTitle = ariaSpecsPreface;
        const helpLinksExist = !!helpLinks.length;

        const openExampleInstructions =
          unescapeHTML(openExampleInstruction) + ' ' + testData.setup_script_description + '.';
        let userInstruction =
          testData.specific_user_instruction +
          ' ' +
          commandListPreface +
          ' ' +
          commandListSettingsPreface;

        const task = testData.task;

        // This is temporary while transitioning from lists to strings
        const mode = typeof testData.mode === 'string' ? testData.mode : testData.mode[0];
        const atTests = [];

        // TODO: These applies_to strings are not standardized yet.
        let allRelevantATs;
        if (
          testData.applies_to[0].toLowerCase() === 'desktop screen readers' ||
          testData.applies_to[0].toLowerCase() === 'screen readers'
        ) {
          allRelevantATs = allATKeys;
        } else {
          allRelevantATs = testData.applies_to;
        }
        allRelevantATs = [...new Set(allRelevantATs)];

        for (const atKey of allRelevantATs.map(a => a.toLowerCase())) {
          let assertionsInstructions,
            assertionsForCommandsInstructions,
            commandsValuesForInstructions,
            modeInstructions = undefined;
          let at = commandsAPI.isKnownAT(atKey);
          const defaultConfigurationInstructions = unescapeHTML(
            commandsAPI.defaultConfigurationInstructions(atKey)
          );

          if (testData.additional_assertions && testData.additional_assertions[at.key]) {
            assertionsInstructions = testData.additional_assertions[at.key];
          } else {
            assertionsInstructions = testData.output_assertions;
          }

          const defaultAssertionsInstructions =
            assertionsInstructions && assertionsInstructions.length
              ? assertionsInstructions.map(a => {
                  // V1 support
                  if (Array.isArray(a)) {
                    return {
                      assertionId: null,
                      priority: getPriorityString(a[0]),
                      assertionPhrase: 'N/A',
                      assertionStatement: a[1],
                      commandInfo: null,
                    };
                  }

                  // V2 support
                  return {
                    assertionId: a.assertionId,
                    priority: getPriorityString(a.priority),
                    assertionPhrase: a.assertionPhrase,
                    assertionStatement:
                      a.tokenizedAssertionStatements?.[at.key] || a.assertionStatement,
                    commandInfo: a.commandInfo,
                  };
                })
              : undefined;

          try {
            assertionsForCommandsInstructions = commandsAPI.getATCommands(
              mode,
              task,
              {
                ...at,
                settings: {
                  ...at.settings,
                  defaultMode: {
                    screenText: 'default mode active',
                    instructions: [at.defaultConfigurationInstructionsHTML],
                  },
                },
              },
              testData.commandPresentationNumber
            );
            if (
              assertionsForCommandsInstructions.length &&
              typeof assertionsForCommandsInstructions[0] === 'object'
            ) {
              commandsValuesForInstructions = assertionsForCommandsInstructions.map(
                each => each.value
              );
            } else {
              // V1 came in as array of strings
              if (assertionsForCommandsInstructions.every(each => typeof each === 'string')) {
                commandsValuesForInstructions = assertionsForCommandsInstructions;
                assertionsForCommandsInstructions = assertionsForCommandsInstructions.map(each => ({
                  value: each,
                }));
              }
            }

            // For V2 to handle assertion exceptions
            assertionsForCommandsInstructions = assertionsForCommandsInstructions.map(
              (assertionForCommand, assertionForCommandIndex) => {
                const assertionsInstructions = defaultAssertionsInstructions.map(assertion => {
                  let priority = assertion.priority;

                  // Check to see if there is any command info exceptions for current at key
                  if (assertion.commandInfo && assertion.commandInfo[at.key]) {
                    assertion.commandInfo[at.key].forEach(commandInfoForAt => {
                      if (
                        commandInfoForAt.command === assertionForCommand.key &&
                        commandInfoForAt.assertionExceptions.includes(assertion.assertionId) &&
                        commandInfoForAt.testId === task
                      ) {
                        for (const exceptionPair of commandInfoForAt.assertionExceptions.split(
                          ' '
                        )) {
                          let [exceptionPriority, exceptionAssertion] = exceptionPair.split(':');
                          exceptionPriority = Number(exceptionPriority);

                          if (assertion.assertionId === exceptionAssertion) {
                            priority = getPriorityString(exceptionPriority);
                          }
                        }
                      }
                    });
                  }

                  return {
                    ...assertion,
                    priority,
                  };
                });

                return {
                  ...assertionForCommand,
                  assertionsInstructions,
                  elemId: `t${testNumber}-${at.key}-c${assertionForCommandIndex + 1}`,
                  mustCount: assertionsInstructions.reduce(
                    (acc, curr) => acc + (curr.priority === 'MUST' ? 1 : 0),
                    0
                  ),
                  shouldCount: assertionsInstructions.reduce(
                    (acc, curr) => acc + (curr.priority === 'SHOULD' ? 1 : 0),
                    0
                  ),
                  mayCount: assertionsInstructions.reduce(
                    (acc, curr) => acc + (curr.priority === 'MAY' ? 1 : 0),
                    0
                  ),
                };
              }
            );

            if (commandsValuesForInstructions && !commandsValuesForInstructions.length) {
              // Invalid state to reflect that no commands have been added to the related .csv in the template
              commandsValuesForInstructions = undefined;
              userInstruction = testData.specific_user_instruction + ' ' + commandListPreface;
            }
          } catch (error) {
            // An error will occur if there is no data for a screen reader, ignore it
          }

          for (const atMode of mode.split('_')) {
            const atSettingsWithDefault = {
              ...at.settings,
              defaultMode: {
                screenText: 'default mode active',
                instructions: [at.defaultConfigurationInstructionsHTML],
              },
            };

            if (atSettingsWithDefault.atMode) {
              let settings = atSettingsWithDefault[atMode];
              const modifiedSettings = {
                ...settings,
                screenText: settingInstructionsPreface + ' ' + settings.screenText + ':',
                instructions: settings.instructions.map(instruction => {
                  return unescapeHTML(instruction);
                }),
              };
              if (!modeInstructions) modeInstructions = [modifiedSettings];
              else modeInstructions = [...modeInstructions, modifiedSettings];
            }
          }

          atTests.push({
            atName: at.name,
            atKey: at.key,
            commandsValuesForInstructions,
            assertionsForCommandsInstructions,
            defaultConfigurationInstructions,
            openExampleInstructions,
            modeInstructions,
            userInstruction,
          });
        }

        // Create the test review pages
        const testFilePath = path.join(testsDirectory, directory);
        // TODO: useful for determining smart-diffs
        const output = spawnSync('git', ['log', '-1', '--format="%ad"', testFilePath]);
        const lastEdited = output.stdout.toString().replace(/"/gi, '').replace('\n', '');

        tests.push({
          testNumber,
          title: title.value,
          name: testFullName,
          location: `/${directory}/${test}`,
          reference: `/${directory}/${path.posix.join(
            path.dirname(reference.value),
            path.basename(reference.value, '.html')
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
          lastEdited,
        });
      });

    if (tests.length) {
      allTestsForPattern[directory] = tests;
    }
  }
});

let template = fse.readFileSync(reviewTemplateFilePath, 'utf8');
let indexTemplate = fse.readFileSync(reviewIndexTemplateFilePath, 'utf8');

const getRenderValues = (
  references,
  { pattern, totalTests, tests, atOptions = support.ats, setupScripts = scripts }
) => {
  const supportingDocs = [];

  const { value: title } = getReferenceForDirectory(references, 'title');
  const { value: exampleLink, linkText: exampleLinkText } = getReferenceForDirectory(
    references,
    'example'
  );
  const { value: designPatternLink, linkText: designPatternLinkText } = getReferenceForDirectory(
    references,
    'designPattern'
  );
  const { value: developmentDocumentationLink, linkText: developmentDocumentationLinkText } =
    getReferenceForDirectory(references, 'developmentDocumentation');

  // Handle special cases where text could be null
  let defaultExampleLinkText;
  let defaultDesignPatternLinkText;

  if (exampleLink) {
    defaultExampleLinkText = `APG example: ${exampleLink.split('examples/')[1]}`;
  }
  if (designPatternLink) {
    defaultDesignPatternLinkText = `ARIA specification: ${designPatternLink.split('#')[1]}`;
  }

  if (exampleLink)
    supportingDocs.push({ link: exampleLink, text: exampleLinkText || defaultExampleLinkText });
  if (designPatternLink)
    supportingDocs.push({
      link: designPatternLink,
      text: designPatternLinkText || defaultDesignPatternLinkText,
    });
  if (developmentDocumentationLink)
    supportingDocs.push({
      link: developmentDocumentationLink,
      text: developmentDocumentationLinkText,
    });

  return {
    title,
    pattern,
    totalTests,
    tests,
    atOptions,
    setupScripts,
    supportingDocs,
  };
};

if (TARGET_TEST_PLAN) {
  if (allTestsForPattern[TARGET_TEST_PLAN]) {
    const references = referencesForPattern[TARGET_TEST_PLAN];
    const renderValues = getRenderValues(references, {
      pattern: TARGET_TEST_PLAN,
      tests: allTestsForPattern[TARGET_TEST_PLAN],
      totalTests: allTestsForPattern[TARGET_TEST_PLAN].length,
    });
    let rendered = mustache.render(template, renderValues);

    let summaryBuildFile = path.resolve(reviewBuildDirectory, `${TARGET_TEST_PLAN}.html`);
    fse.writeFileSync(summaryBuildFile, rendered);

    console.log(`Summarized ${TARGET_TEST_PLAN} tests: ${summaryBuildFile}`);
  } else {
    // most likely to happen if incorrect directory specified
    console.error('ERROR: Unable to find valid test plan(s).');
    process.exit();
  }
} else {
  for (let pattern in allTestsForPattern) {
    const references = referencesForPattern[pattern];
    const renderValues = getRenderValues(references, {
      pattern: pattern,
      tests: allTestsForPattern[pattern],
      totalTests: allTestsForPattern[pattern].length,
    });
    let rendered = mustache.render(template, renderValues);

    let summaryBuildFile = path.resolve(reviewBuildDirectory, `${pattern}.html`);
    fse.writeFileSync(summaryBuildFile, rendered);

    console.log(`Summarized ${pattern} tests: ${summaryBuildFile}`);
  }
}

const renderedIndex = mustache.render(indexTemplate, {
  patterns: Object.keys(allTestsForPattern)
    .map(pattern => {
      // TODO: useful for determining smart-diffs; this has to continue generating for all patterns until smart-diffs come into play
      const lastCommit = spawnSync('git', [
        'log',
        '-n1',
        '--oneline',
        path.join('.', 'tests', pattern),
      ]).stdout.toString();
      return {
        patternName: pattern,
        title: allTestsForPattern[pattern][0].title,
        numberOfTests: allTestsForPattern[pattern].length,
        commit: lastCommit.split(' ')[0],
        commitDescription: lastCommit,
      };
    })
    .sort((a, b) => {
      const titleA = a.title.toUpperCase();
      const titleB = b.title.toUpperCase();

      if (titleA < titleB) return -1;
      if (titleA > titleB) return 1;
      return 0;
    }),
});

fse.writeFileSync(indexFileBuildOutputPath, renderedIndex);

console.log(`\nGenerated index.html: ${indexFileBuildOutputPath}`);
console.log('\nDone.');
