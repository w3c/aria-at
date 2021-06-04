const path = require('path');
const fs = require('fs');
const {createExampleTests} = require('./create-example-tests');

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    d: 'directory',
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
    -d, --directory
       Generate tests and view a detailed report summary for an individual test plan directory. eg. --directory=checkbox
    -v, --verbose
       Generate tests and view a detailed report summary.
    -V, --validate
       Determine whether current test plans are valid (no errors present).
`);
  process.exit();
}

const TARGET_DIRECTORY = args.directory; // individual test plan to generate test assets for

const scriptsDirectory = path.dirname(__filename);
const rootDirectory = scriptsDirectory.split('scripts')[0];
const testsDirectory = path.join(rootDirectory, 'tests');

const filteredTestPlans = fs.readdirSync(testsDirectory)
  .filter(f => TARGET_DIRECTORY ?
    f !== 'resources' && f === TARGET_DIRECTORY && fs.statSync(path.join(testsDirectory, f)).isDirectory() : // checking to see if individual test plan has been specified
    f !== 'resources' && fs.statSync(path.join(testsDirectory, f)).isDirectory()
  )

if (!filteredTestPlans.length) { // most likely to happen if incorrect directory specified
  console.error(`ERROR: Unable to find any valid test plans.`);
  process.exit();
}

filteredTestPlans.forEach((directory, index, array) => createExampleTests({
    directory: path.join('tests', directory),
    isLast: index === array.length - 1,
    args
  })
);
