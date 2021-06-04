const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

const args = require('minimist')(
  process.argv.slice(2),
  {
    alias: {
      h: 'help'
    },
  }
);

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

let totalTestPlans = 0;
let totalTests = 0;
let totalAssertions = 0;
let totalCommandAssertions = 0;

function parseCSV(filename) {
  return new Promise((resolve, reject) => {
    let data = [];
    fs.createReadStream(filename)
      .pipe(csv())
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        resolve(data);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// count metrics for tests / commands
function countTests(tests, commands) {
  for (let [i, test] of tests.entries()) {
    const command = commands[i];
    
    let numCommands = 0;
    for (let letter of ['A', 'B', 'C', 'D', 'E', 'F']) {
      if (command[`command${letter}`]) {
        numCommands++;
      }
    }

    let numAssertions = 0;
    for (let j = 0; j < 7; j++) {
      if (test[`assertion${j+1}`]) {
        numAssertions++;
      }
    }

    totalTests++;
    totalAssertions += numAssertions;
    totalCommandAssertions += numAssertions * numCommands;
  }
}

// count metrics for test plan directory
function count(directory) {
  return new Promise((resolve, reject) => {
    totalTestPlans++;

    parseCSV(path.join(directory, 'data', 'tests.csv'))
      .then((tests) => {
        parseCSV(path.join(directory, 'data', 'commands.csv'))
          .then((commands) => {
            countTests(tests, commands);
            resolve();
          })
          .catch(error => {
            reject(error);
          })
      })
      .catch(error => {
        reject(error);
      })
  });
}

let promises = [];

// if test plan given as argument, count one test plan directory
if (args._.length) {
  const directory = args._[0];

  try {
    fs.statSync(path.join(testsDirectory, directory));
  } catch (error) {
    console.error('The specified directory does not exist.');
    process.exit(1);
  }

  promises.push(
    count(path.join(testsDirectory, directory))
  );

// else, count all directories
} else {
  const directories = fs.readdirSync(testsDirectory)
    .filter(f => f !== 'resources' && fs.statSync(path.join(testsDirectory, f)).isDirectory());

  for (let directory of directories) {
    promises.push(
      count(path.join(testsDirectory, directory))
    );
  }
}

// wait for all promises to complete, then read totals
Promise.all(promises)
  .then(() => {
    console.log(`${totalTestPlans} test plans, ${totalTests} tests, ${totalAssertions} assertions, ${totalCommandAssertions} command/assertion pairs`);
    process.exit();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
