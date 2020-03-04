'use strict';
const path = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const util = require('util');
const csv = require('csv-parser');
const readline = require('readline');
const fs = require('fs');


const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help'
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

const scriptDirectory = path.dirname(__filename);
const rootDirectory = scriptDirectory.split('scripts')[0];
const testDirectory = rootDirectory + args._[0];

const testsFile = testDirectory + '\\data\\tests.csv';
const atCommandsFile = testDirectory + '\\data\\at-commands.csv';
const referencesFile = testDirectory + '\\data\\references.csv';
const javascriptDir  = testDirectory + '\\data\\js\\';

try {
  fse.statSync(testDirectory);
}
catch (err) {
  console.log("The test directory '" + testDirectory + "' does not exist. Check the path to tests.");
  process.exit();
}

try {
  fse.statSync(testsFile);
}
catch (err) {
  console.log("The tests.csv file does not exist. Please create '" + testsFile + "' file.");
  process.exit();
}

try {
  fse.statSync(atCommandsFile);
}
catch (err) {
  console.log("The at-commands.csv file does not exist. Please create '" + atCommandsFile + "' file.");
  process.exit();
}

try {
  fse.statSync(referencesFile);
}
catch (err) {
  console.log("The references.csv file does not exist. Please create '" + referencesFile + "' file.");
  process.exit();
}

// delete test files

var deleteTestFiles = function(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0) {
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile()) {
        fs.unlinkSync(filePath);
      }
    }
  }
};

// Create AT commands file

function createATCommandFile(cmds) {

  const fname = testDirectory + '\\commands.json';
  let data = {};

  function addCommand(task, mode, at, key) {

    if (typeof key !== 'string' || key.length === 0) {
      return;
    }

    if (typeof data[task] !== 'object') {
      data[task] = {};
    }

    if (typeof data[task][mode] !== 'object') {
      data[task][mode] = {};
    }

    if (typeof data[task][mode][at] !== 'object' ) {
      data[task][mode][at] = [];
    }

    let item = [];
    item.push(key);

    data[task][mode][at].push(item);
  }

  cmds.forEach(function(cmd) {

    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandA);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandB);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandC);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandD);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandE);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandF);

  });

  fs.writeFileSync(fname, JSON.stringify(data));

};

// Create Test File

function createTestFile (test, refs, commands) {

  function addAssertion(a) {
    let level = '1';
    let str = a;
    a = a.trim();

    let parts = a.split(':');

    if (parts.length === 2) {
      level = parts[0];
      str = parts[1].substring(1);
    }

    if (a.length) {
      assertions += `      [${level}, "${str}"],\n`
    }
  }

  let fname = testDirectory + '\\' + test.task.replace('/ /g', '-') + '.html'

  // get references (e.g. links)
  let references = ''

  if (typeof refs.example === 'string' && refs.example.length) {
    references += `<link rel="example" href="${refs.example}">\n`;
  }

  let items = test.refs.split(' ');
  items.forEach(function(item) {
    item = item.trim();

    if (item.length) {
      references += `<link rel="help" href="${refs[item]}">\n`;
    }
  });

  let setupTestPage = ''

  if (typeof test.setupScript === 'string') {
    test.setupScript = test.setupScript.trim();

    if (test.setupScript.length) {
      let script = '';

      try {
          // read contents of the file
          const data = fs.readFileSync(javascriptDir + test.setupScript + '.js', 'UTF-8');

          // split the contents by new line
          const lines = data.split(/\r?\n/);

          // print all lines
          lines.forEach((line) => {
            if (line.trim().length)
            script += '      ' + line.trim() + '\n';
          });
      } catch (err) {
          console.error(err);
      }


      setupTestPage = `setupTestPage: function setupTestPage(testPageDocument) {
${script}    },`
    }

  }

  // Get assertions
  let assertions = ''
  addAssertion(test.assertion1);
  addAssertion(test.assertion2);
  addAssertion(test.assertion3);
  addAssertion(test.assertion4);
  addAssertion(test.assertion5);
  addAssertion(test.assertion6);

  if (assertions.length > 1) {
    assertions = assertions.substring(0,assertions.length-2);
  }

  let testHTML = `
<!DOCTYPE html>
<meta charset="utf-8">
<title>${test.title}</title>
<link rel="author" title="${refs.author}" href="mailto:${refs.authorEmail}">
${references}
<script type="module">
  import { verifyATBehavior, displayTestPageAndInstructions } from "../resources/aria-at-harness.mjs";

  verifyATBehavior({
    setup_script_description: "${test.setupScriptDescription}",
    ${setupTestPage}
    applies_to: ["${test.appliesTo}"],
    mode: "${test.mode}",
    task: "${test.task}",
    specific_user_instruction: "${test.instructions}",
    output_assertions: [
${assertions}
    ]
  });

  displayTestPageAndInstructions("${refs.reference}");

</script>
`;

  fse.writeFileSync(fname, testHTML, 'utf8');
}


// Process CSV files

var refs = {};
var atCommands = [];
var tests = [];

fs.createReadStream(referencesFile)
  .pipe(csv())
  .on('data', (row) => {
    refs[row.refId] = row.value.trim();
  })
  .on('end', () => {
    console.log('References CSV file successfully processed');

    fs.createReadStream(atCommandsFile)
      .pipe(csv())
      .on('data', (row) => {
        atCommands.push(row);
      })
      .on('end', () => {
        console.log('Commands CSV file successfully processed');

        fs.createReadStream(testsFile)
          .pipe(csv())
          .on('data', (row) => {
            tests.push(row);
          })
          .on('end', () => {
            console.log('Test CSV file successfully processed');
            deleteTestFiles(testDirectory);
            createATCommandFile(atCommands);
            tests.forEach(function(test) {
              createTestFile(test, refs, atCommands);
            });
          });
      });
  });


