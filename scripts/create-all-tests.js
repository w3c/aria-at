const path = require('path');
const fs = require('fs');
const { createExampleTests } = require('./create-example-tests');

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    t: 'testplan',
    v: 'verbose',
    V: 'validate',
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
`);
  process.exit();
}

main();

async function main() {
  let successRunsCount = 0;
  let errorRunsCount = 0;
  let totalRunsCount = 0;
  let suppressedMessageCount = 0;

  // on some OSes, it seems the the `npm_config_testplan` environment variable will come back as the actual variable name rather than empty if it does not exist
  const TARGET_TEST_PLAN =
    args.testplan && !args.testplan.includes('npm_config_testplan') ? args.testplan : null; // individual test plan to generate test assets for
  const VERBOSE_CHECK = !!args.verbose;
  const VALIDATE_CHECK = !!args.validate;

  const scriptsDirectory = path.dirname(__filename);
  const rootDirectory = scriptsDirectory.split('scripts')[0];
  const testsDirectory = path.join(rootDirectory, 'tests');

  const filteredTestPlans = fs.readdirSync(testsDirectory).filter(f =>
    TARGET_TEST_PLAN
      ? f !== 'resources' &&
        f === TARGET_TEST_PLAN &&
        fs.statSync(path.join(testsDirectory, f)).isDirectory() // checking to see if individual test plan has been specified
      : f !== 'resources' && fs.statSync(path.join(testsDirectory, f)).isDirectory()
  );

  if (!filteredTestPlans.length) {
    // most likely to happen if incorrect testPlan specified
    console.error('ERROR: Unable to find valid test plan(s).');
    process.exit();
  }

  await Promise.all(
    filteredTestPlans.map(async directory => {
      try {
        const { isSuccessfulRun, suppressedMessages } = await createExampleTests({
          directory: path.join('tests', directory),
          args,
        });
        if (isSuccessfulRun) {
          successRunsCount++;
        } else {
          errorRunsCount++;
        }

        // increment total runs completed
        totalRunsCount = successRunsCount + errorRunsCount;

        // report how many messages have been hidden by not running in verbose mode
        suppressedMessageCount = suppressedMessages;

        if (totalRunsCount === filteredTestPlans.length) {
          // last test plan has been ran
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
      } catch (e) {
        console.error(`ERROR: Unhandled exception thrown while processing "${directory}".`);
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
message: ${e.message}
stacktrace: ${e.stack}
          `);
        }
        process.exit(1);
      }
    })
  );

  if (errorRunsCount > 0) {
    // Exit with a non-zero code to indicate failure to create tests without error in continuous integration.
    process.exit(1);
  }
}
