'use strict';
const path = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const util = require('util');
const csv = require('csv-parser');
const readline = require('readline');
const fs = require('fs');
const beautify = require("json-beautify");


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

const validModes = ['reading', 'interaction'];
const validAppliesTo = ['JAWS', 'NVDA', 'VoiceOver', 'Orca'];

const scriptDirectory = path.dirname(__filename);
const rootDirectory = scriptDirectory.split('scripts')[0];
const testDirectory = rootDirectory + args._[0];
const testDirectoryRelative = args._[0];

const testsFile = testDirectory + '\\data\\tests.csv';
const atCommandsFile = testDirectory + '\\data\\commands.csv';
const referencesFile = testDirectory + '\\data\\references.csv';
const javascriptDirectory = testDirectory + '\\data\\js\\';
const indexFile = testDirectory + '\\index.html';

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

var deleteFilesFromDirectory = function(dirPath) {
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

    let items = key.split('(');

    items[0] = items[0].trim();

    if (items.length === 2) {
      items[1] = '(' + items[1].trim();
    }

    data[task][mode][at].push(items);
  }

  cmds.forEach(function(cmd) {

    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandA);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandB);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandC);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandD);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandE);
    addCommand(cmd.Task, cmd.mode, cmd.at, cmd.commandF);

  });

//  fs.writeFileSync(fname, JSON.stringify(data));
  fs.writeFileSync(fname, beautify(data, null, 2, 40));

  return data;

};

// Create Test File

function createTestFile (test, refs, commands) {


  function getModeValue(value) {
    if (!validModes.includes(value)) {
        addTestError(test.testId, '"' + value + '" is not valid value for "mode" property.')
    }
    return value;
  }

  function validTaskReference(ref) {
    if (typeof commands[ref] !== 'object') {
      addTestError(test.testId, '"' + ref + '" does not exist in commands.csv file.')
    }
  }

  function getAppliesToValues(values) {
    let items = values.split(' ');
    let str = '[';
    items.forEach(function (item) {
      if (!validAppliesTo.includes(item)) {
        addTestError(test.testId, '"' + item + '" is not valid value for "appliesTo" property.')
      }
      str += '"' + item + '"';
      if (items[items.length-1] !== item) {
        str += ',';
      }
    });
    str += ']';
    return str;
  }

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

  function addReferences () {
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
  }

  function getSetupScript (fname) {

    let script = '';
    if (fname.length) {

      try {
        fse.statSync(fname);
      }
      catch (err) {
        addTestError(test.testId, "Setup script does not exist: " + fname);
        return '';
      }

      try {
          const data = fs.readFileSync(fname, 'UTF-8');
          const lines = data.split(/\r?\n/);
          lines.forEach((line) => {
            if (line.trim().length)
            script += '      ' + line.trim() + '\n';
          });
      } catch (err) {
          console.error(err);
      }

      script = `setupTestPage: function setupTestPage(testPageDocument) {
${script}    },`
    }

    return script;
  }


  let references = '';
  let assertions = '';
  let setupFileName = '';
  let testFileName = test.task.replace(/\s+/g, '-').toLowerCase() + '.html';
  let testFileAbsolute = testDirectory + '\\' + testFileName;

  if (typeof test.setupScript === 'string') {
    let setupScript = test.setupScript.trim();
    if (setupScript.length) {
      setupFileName = javascriptDirectory + test.setupScript + '.js';
    }
  }

  validTaskReference(test.task);

  let mode = getModeValue(test.mode);
  let appliesTo = getAppliesToValues(test.appliesTo);
  let setupScript = getSetupScript(setupFileName);

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
    ${setupScript}
    applies_to: ${appliesTo},
    mode: "${mode}",
    task: "${test.task}",
    specific_user_instruction: "${test.instructions}",
    output_assertions: [
${assertions}
    ]
  });

  displayTestPageAndInstructions("${refs.reference}");

</script>
`;

  fse.writeFileSync(testFileAbsolute, testHTML, 'utf8');
  return testFileName;
}

// Create an index file for a local server

function createIndexFile(urls) {

  let links = '';

  urls.forEach( url => links += `<li><a href="${url.href}">${url.title}</a></li>\n`)

  let indexHTML = `
<!DOCTYPE html>
<meta charset="utf-8">
<head>
  <title>Index of Test Files for local Server</title>
</head>
<body>
  <h1>Index of Test Files</h1>
  <p>This is useful for viewing the local files on a local web server and provides links that will work when the local version of the
  test runner is being executed, using <code>npm run start</code> from the root director: <code>${rootDirectory}</code>.</p>
  <ul>
  ${links}
  </ul>
</body>
`;

   fse.writeFileSync(indexFile, indexHTML, 'utf8');
}

// Process CSV files

var refs = {};
var atCommands = [];
var tests = [];
var errorCount = 0;
var errors = '';
var indexOfURLs = [];

function addTestError(id, error) {
  errorCount += 1;
  errors += '[Test ' + id + ']: ' + error + '\n';
}

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

            console.log('Deleting current test files...')
            deleteFilesFromDirectory(testDirectory);

            console.log('Creating AT commands file')
            atCommands = createATCommandFile(atCommands);

            console.log('Creating the following test files: ')
            tests.forEach(function(test) {
              try {
                let url = createTestFile(test, refs, atCommands);
                indexOfURLs.push({ title: test.title, href: url});
                console.log('[Test ' + test.testId + ']: ' + url);
              }
              catch (err) {
                console.error(err);
              }
            });

            createIndexFile(indexOfURLs);

            if (errorCount) {
              console.log('\n\n*** ' + errorCount + ' Errors in tests ***');
              console.log(errors);
            }
            else {
              console.log('No validation errors detected');
            }
          });
      });
  });

