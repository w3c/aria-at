const path = require('path');
const fse = require('fs-extra');
const {
  processTestDirectory: processTestDirectoryV2,
} = require('../../lib/data/process-test-directory');
const {
  processTestDirectory: processTestDirectoryV1,
} = require('../../lib/data/process-test-directory/v1');
const { consoleText, consoleColors } = require('../../lib/util/console');

/**
 * @param {string} testsDirectory - Path to the tests directory
 * @param {string|null} targetTestPlan - Specific test plan to find, or null for all
 * @returns {Array<{name: string, subfolder: string|null, subfolderName: string|null}>} Array of test plan info
 */
function getAllTestPlans(testsDirectory, targetTestPlan) {
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
            testPlans.push({
              name: entry.name,
              subfolder: null,
              subfolderName: null,
            });
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
                    });
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

const cliArgs = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    t: 'testplan',
    v: 'verbose',
    V: 'validate',
    v1: 'version1',
    v2: 'version2',
  },
});

if (cliArgs.help) {
  console.log(`Default use:
  No arguments:
    Generate tests and view report summary.
  Arguments:
    -h, --help
       Show this message.
    -t, --testplan
       Generate tests and view a detailed report summary for an individual test plan directory. eg. --testplan=checkbox
    -v, --verbose
       Generate tests and view a detailed report summary.
    -V, --validate
       Determine whether current test plans are valid (no errors present).
    -v1, --version1
       Build the tests with the v1 format of the tests
    -v2, --version2
       Build the tests with the v2 format of the tests
`);
  process.exit();
}

/**
 *
 * @param {object} config
 * @param {object} config.args
 * @param {string} config.args.testplan
 * @param {boolean} config.args.validate
 * @param {boolean} config.args.verbose
 * @param {boolean} config.args.testMode
 * @param {string} config.buildOutputDirectory
 * @param {string} config.testsDirectory
 * @returns {Promise<void>}
 */
async function createAllTests(config = {}) {
  const args = config?.args ?? cliArgs;

  // on some OSes, it seems the `npm_config_testplan` environment variable will come back as the actual variable name rather than empty if it does not exist
  const TARGET_TEST_PLAN =
    args.testplan && !args.testplan.includes('npm_config_testplan') ? args.testplan : null; // individual test plan to generate test assets for

  const VERBOSE_CHECK = !!args.verbose;
  const VALIDATE_CHECK = !!args.validate;
  const V1_CHECK = !!args.v1;
  const V2_CHECK = !!args.v2;

  const scriptsDirectory = path.dirname(__filename);
  const rootDirectory = path.join(scriptsDirectory, '../..');
  const testsDirectory = config?.testsDirectory ?? path.join(rootDirectory, 'tests');

  // Get all test plans including those in subfolders
  const filteredTestPlans = getAllTestPlans(testsDirectory, TARGET_TEST_PLAN);

  if (!filteredTestPlans.length) {
    // most likely to happen if incorrect testPlan specified
    console.error('ERROR: Unable to find valid test plan(s).');
    process.exit();
  }

  const filteredTests = await Promise.all(
    filteredTestPlans.map(testPlan => {
      let FALLBACK_V1_CHECK = false;
      let FALLBACK_V2_CHECK = false;

      // Check if files exist for doing v2 build by default first, then try v1
      if (!V1_CHECK && !V2_CHECK) {
        // Use existence of assertions.csv to determine if v2 format files exist for now
        const testPlanPath = testPlan.subfolder
          ? path.join(testsDirectory, testPlan.subfolder, testPlan.name)
          : path.join(testsDirectory, testPlan.name);
        const assertionsCsvPath = path.join(testPlanPath, 'data', 'assertions.csv');

        if (fse.existsSync(assertionsCsvPath)) FALLBACK_V2_CHECK = true;
        else FALLBACK_V1_CHECK = true;
      }

      const directoryPath = testPlan.subfolder
        ? path.join('tests', testPlan.subfolder, testPlan.name)
        : path.join('tests', testPlan.name);

      if (FALLBACK_V2_CHECK || V2_CHECK) {
        return processTestDirectoryV2({
          args,
          testsDirectory,
          directory: directoryPath,
          buildOutputDirectory: config?.buildOutputDirectory,
        }).catch(error => {
          error.directory = testPlan.name;
          throw error;
        });
      } else if (FALLBACK_V1_CHECK || V1_CHECK) {
        return processTestDirectoryV1({
          args,
          testsDirectory,
          directory: directoryPath,
          buildOutputDirectory: config?.buildOutputDirectory,
        }).catch(error => {
          error.directory = testPlan.name;
          throw error;
        });
      }
    })
  ).catch(error => {
    console.error(`ERROR: Unhandled exception thrown while processing "${error.directory}".`);
    if (!VERBOSE_CHECK) {
      console.log(
        `
NOTE:
Run 'npm run create-all-tests -- --verbose' to view detailed information on error.
Run 'npm run create-all-tests -- --help' or 'node ./scripts/create-all-tests.js --help' to learn more.
`
      );
    } else {
      console.error(`
message: ${error.message}
stacktrace: ${error.stack}
      `);
    }
    process.exit(1);
  });

  /**
   * @param {number[]} values
   * @returns {number}
   */
  function sum(values) {
    return values.reduce((carry, value) => carry + value, 0);
  }

  const totalRunsCount = filteredTests.length;
  const successRunsCount = sum(
    filteredTests.map(({ isSuccessfulRun }) => (isSuccessfulRun ? 1 : 0))
  );

  // report how many messages have been hidden by not running in verbose mode
  const suppressedMessageCount = sum(
    filteredTests.map(({ suppressedMessages }) => suppressedMessages)
  );

  // last test plan has been run
  if (VALIDATE_CHECK) {
    consoleText(
      `\n(${successRunsCount}) out of (${totalRunsCount}) test plan(s) successfully processed without any validation errors.\n`,
      {
        color:
          successRunsCount === 0
            ? consoleColors.red
            : successRunsCount !== totalRunsCount
              ? consoleColors.yellow
              : consoleColors.green,
      }
    );
  } else {
    consoleText(
      `\n(${successRunsCount}) out of (${totalRunsCount}) test plan(s) successfully processed and generated without any validation errors.\n`,
      {
        color:
          successRunsCount === 0
            ? consoleColors.red
            : successRunsCount !== totalRunsCount
              ? consoleColors.yellow
              : consoleColors.green,
      }
    );
  }

  if (!VERBOSE_CHECK) {
    consoleText(
      `NOTE: ${suppressedMessageCount} messages suppressed. Run 'npm run create-all-tests -- --help' or 'node ./scripts/create-all-tests.js --help' to learn more.`,
      {
        color: suppressedMessageCount === 0 ? consoleColors.reset : consoleColors.yellow,
      }
    );
  }
}

module.exports = createAllTests;
