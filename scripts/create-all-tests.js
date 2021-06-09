const path = require('path');
const fs = require('fs');
const {createExampleTests} = require('./create-example-tests');

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    t: 'testplan',
    v: 'verbose',
    V: 'validate'
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

const TARGET_TEST_PLAN = args.testplan; // individual test plan to generate test assets for

const scriptsDirectory = path.dirname(__filename);
const rootDirectory = scriptsDirectory.split('scripts')[0];
const testsDirectory = path.join(rootDirectory, 'tests');

const filteredTestPlans = fs.readdirSync(testsDirectory)
  .filter(f => TARGET_TEST_PLAN ?
    f !== 'resources' && f === TARGET_TEST_PLAN && fs.statSync(path.join(testsDirectory, f)).isDirectory() : // checking to see if individual test plan has been specified
    f !== 'resources' && fs.statSync(path.join(testsDirectory, f)).isDirectory()
  )

if (!filteredTestPlans.length) { // most likely to happen if incorrect testPlan specified
  console.error('ERROR: Unable to find valid test plan(s).');
  process.exit();
}

filteredTestPlans.forEach((directory, index, array) => createExampleTests({
    directory: path.join('tests', directory),
    isLast: index === array.length - 1,
    args
  })
);
