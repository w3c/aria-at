const path = require('path');
const fs = require('fs');

const csv = require('../lib/util/csv');

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
  },
});

if (args.help) {
  console.log(`
Default use:
  node count-assertions.js [directory]
    Counts test plans, tests, assertions, and command/assertion pairs
    for all directories. Counts only a single directory if specified as
    optional first argument.
  Arguments:
    -h, --help
      Show this message.
`);
  process.exit();
}

const testsDirectory = path.resolve(__dirname, '..', 'tests');

/**
 * @param {string} filepath
 * @returns {Promise<object[]>}
 */
function parseCSV(filepath) {
  return csv.read(fs.createReadStream(filepath), {
    logError: (...args) => console.error(`[${path.relative(testsDirectory, filepath)}]`, ...args),
  });
}

/**
 * Count metrics for arrays of test and command objects.
 * @param {AriaATCSV.Test[]} tests
 * @param {AriaATCSV.Command[]} commands
 */
function countTests(tests, commands) {
  let totalTests = 0;
  let totalAssertions = 0;
  let totalCommandAssertions = 0;

  for (const [i, test] of tests.entries()) {
    const command = commands[i];

    let numCommands = 0;
    for (const letter of [
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z',
    ]) {
      if (command[`command${letter}`]) {
        numCommands++;
      }
    }

    let numAssertions = 0;
    for (let j = 0; j < 30; j++) {
      if (test[`assertion${j + 1}`]) {
        numAssertions++;
      }
    }

    totalTests++;
    totalAssertions += numAssertions;
    totalCommandAssertions += numCommands * numAssertions;
  }

  return {
    tests: totalTests,
    assertions: totalAssertions,
    commandAssertions: totalCommandAssertions,
  };
}

/**
 * @typedef TestPlanCount
 * @property {number} testPlans
 * @property {number} tests
 * @property {number} assertions
 * @property {number} commandAssertions
 */

/**
 * Count metrics for a test plan directory.
 * @param {string} directory
 * @return {Promise<TestPlanCount>}
 */
async function count(directory) {
  return {
    testPlans: 1,
    ...countTests(
      await parseCSV(path.join(directory, 'data', 'tests.csv')),
      await parseCSV(path.join(directory, 'data', 'commands.csv'))
    ),
  };
}

/**
 * @param {TestPlanCount} first
 * @param {TestPlanCount} second
 * @returns {TestPlanCount}
 */
function addCounts(first, second) {
  return {
    testPlans: first.testPlans + second.testPlans,
    tests: first.tests + second.tests,
    assertions: first.assertions + second.assertions,
    commandAssertions: first.commandAssertions + second.commandAssertions,
  };
}

/**
 * Detect list of test plan directories.
 * @returns {Promise<string[]>}
 */
async function detectDirectories() {
  // if test plan given as argument, pick its directory
  if (args._.length) {
    const directory = args._[0];

    try {
      fs.statSync(path.join(testsDirectory, directory));
    } catch (error) {
      console.error('The specified directory does not exist.');
      process.exit(1);
    }

    return [directory];
  }

  // pick all directories, excluding "resources"
  return fs
    .readdirSync(testsDirectory)
    .filter(
      name => name !== 'resources' && fs.statSync(path.join(testsDirectory, name)).isDirectory()
    );
}

async function main() {
  // Choose one specified test plan directory or all test plan directories.
  const directories = await detectDirectories();

  // Count each test plan on its own.
  const countsPerPlan = await Promise.all(
    directories.map(name => count(path.join(testsDirectory, name)))
  );

  // Sum all test plan counts.
  const totals = countsPerPlan.reduce(addCounts);

  // Report total counts.
  console.log(
    `${totals.testPlans} test plans, ${totals.tests} tests, ${totals.assertions} assertions, ${totals.commandAssertions} command/assertion pairs`
  );
  process.exit();
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
