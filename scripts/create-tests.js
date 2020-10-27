'use strict';
const { createExampleTests } = require('./create-example-tests');

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    i: 'initialize'  // future feature
  },
});

if (args.help) {
  console.log(`
Default use:
  node create-tests.js directory
    Will create tests from information in the [path to test files]/data/ directory
    The data directory needs to have the following CSV files:
      at-commands.csv
      references.csv
      test.csv
  Arguments:
    -h, --help
       Show this message.
`);
  process.exit();
}

if (args._.length !== 1) {
  console.log("Command expects a directory name, please supply.");
  process.exit();
}

createExampleTests(args._[0]);
