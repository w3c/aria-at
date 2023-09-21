const path = require('path');

const fse = require('fs-extra');

const { processTestDirectory } = require('../lib/data/process-test-directory');
const { processTestDirectory: processTestDirectoryOld } = require('../lib/data/process-test-directory-v1');

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    t: 'testplan',
    v: 'verbose',
    V: 'validate',
    v2: 'version2',
  },
});

if (args.help) {
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
    -v2, --version2
       Build the tests with the v2 format of the tests
`);
  process.exit();
}

main();

async function main() {
  // on some OSes, it seems the `npm_config_testplan` environment variable will come back as the actual variable name rather than empty if it does not exist
  const TARGET_TEST_PLAN =
    args.testplan && !args.testplan.includes('npm_config_testplan') ? args.testplan : null; // individual test plan to generate test assets for

  const VERBOSE_CHECK = !!args.verbose;
  const VALIDATE_CHECK = !!args.validate;
  const V2_CHECK = !!args.v2;

  const scriptsDirectory = path.dirname(__filename);
  const rootDirectory = path.join(scriptsDirectory, '..');
  const testsDirectory = path.join(rootDirectory, 'tests');

  const filteredTestPlans = fse.readdirSync(testsDirectory).filter(f =>
    TARGET_TEST_PLAN
      ? f !== 'resources' &&
        f === TARGET_TEST_PLAN &&
        fse.statSync(path.join(testsDirectory, f)).isDirectory() // checking to see if individual test plan has been specified
      : f !== 'resources' && fse.statSync(path.join(testsDirectory, f)).isDirectory()
  );

  if (!filteredTestPlans.length) {
    // most likely to happen if incorrect testPlan specified
    console.error('ERROR: Unable to find valid test plan(s).');
    process.exit();
  }

  const filteredTests = await Promise.all(
    filteredTestPlans.map(directory => {
      if (V2_CHECK)
        return processTestDirectory({
          directory: path.join('tests', directory),
          args,
        }).catch(error => {
          error.directory = directory;
          throw error;
        });
      else
        return processTestDirectoryOld({
          directory: path.join('tests', directory),
          args,
        }).catch(error => {
          error.directory = directory;
          throw error;
        });
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
    console.log(
      `(${successRunsCount}) out of (${totalRunsCount}) test plan(s) successfully processed without any validation errors.\n`
    );
  } else {
    console.log(
      `(${successRunsCount}) out of (${totalRunsCount}) test plan(s) successfully processed and generated without any validation errors.\n`
    );
  }

  if (!VERBOSE_CHECK) {
    console.log(
      `NOTE: ${suppressedMessageCount} messages suppressed. Run 'npm run create-all-tests -- --help' or 'node ./scripts/create-all-tests.js --help' to learn more.`
    );
  }
}
