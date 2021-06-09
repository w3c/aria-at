const path = require('path');
const fs = require('fs');
const {spawnSync} = require('child_process');

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

let skippedTestPlansCount = 0;

const scriptsDirectory = path.dirname(__filename);
const rootDirectory = scriptsDirectory.split('scripts')[0];
const testsDirectory = path.join(rootDirectory, 'tests');

const checkTestPlanChanged = directory => {
  // may want to be more direct with which files to be looking for in each test plan directory?
  const diffResult = spawnSync('git', ['diff', '--shortstat', path.join(testsDirectory, directory)]).stdout.toString();
  if (!diffResult) skippedTestPlansCount += 1;
  return diffResult
}

const filteredTestPlans = fs.readdirSync(testsDirectory)
  .filter(f => TARGET_DIRECTORY ?
    f !== 'resources' && f === TARGET_DIRECTORY && fs.statSync(path.join(testsDirectory, f))
      .isDirectory() && checkTestPlanChanged(f) : // checking to see if individual test plan has been specified
    f !== 'resources' && fs.statSync(path.join(testsDirectory, f)).isDirectory() && checkTestPlanChanged(f)
  )

if (skippedTestPlansCount || !filteredTestPlans.length) console.log(`${skippedTestPlansCount} test plan(s) skipped. No changes found.`);

if (!filteredTestPlans.length) { // most likely to happen if incorrect directory specified
  console.error('ERROR: Unable to find valid or updated test plan(s) to process.');
  process.exit();
}

filteredTestPlans.forEach((directory, index, array) => createExampleTests({
    directory: path.join('tests', directory),
    isLast: index === array.length - 1,
    args
  })
);
