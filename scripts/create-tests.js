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
const validAppliesTo = ['Screen Readers', 'Desktop Screen Readers', 'JAWS', 'NVDA', 'VoiceOver', 'Orca'];

const scriptDirectory = path.dirname(__filename);
const rootDirectory = scriptDirectory.split('scripts')[0];
const testDirectory = path.join(rootDirectory, args._[0]);
const testDirectoryRelative = args._[0];

const keysFile = path.join(rootDirectory, 'tests', 'resources', 'keys.mjs');

const testsFile = path.join(testDirectory, 'data', 'tests.csv');
const atCommandsFile = path.join(testDirectory, 'data', 'commands.csv');
const referencesFile = path.join(testDirectory, 'data', 'references.csv');
const javascriptDirectory = path.join(testDirectory, 'data', 'js');
const indexFile = path.join(testDirectory,'index.html');

const keyDefs = {};

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

// get Keys that are defined

try {
    // read contents of the file
    const keys = fs.readFileSync(keysFile, 'UTF-8');

    // split the contents by new line
    const lines = keys.split(/\r?\n/);

    // print all lines
    lines.forEach((line) => {
      let parts1 = line.split(' ');
      let parts2 = line.split('"');

      if (parts1.length > 3) {
        let code = parts1[2].trim();
        keyDefs[code] = parts2[1].trim();
      }

    });
} catch (err) {
    console.error(err);
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

  const fname = path.join(testDirectory, 'commands.json');
  let data = {};

  function addCommand(task, mode, at, key) {

    task = task.replace(/'/g, '').replace(/;/g, '').trim().toLowerCase();
    mode = mode.trim().toLowerCase();
    at = at.trim().toLowerCase();


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

    if (typeof keyDefs[items[0]] !== 'string') {
      addCommandError(task, items[0]);
    }

    if (items.length === 2) {
      items[1] = '(' + items[1].trim();
    }

    data[task][mode][at].push(items);
  }

  cmds.forEach(function(cmd) {

    addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandA);
    addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandB);
    addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandC);
    addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandD);
    addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandE);
    addCommand(cmd.task, cmd.mode, cmd.at, cmd.commandF);

  });

//  fs.writeFileSync(fname, JSON.stringify(data));
  fs.writeFileSync(fname, beautify(data, null, 2, 40));

  return data;

};

// Create Test File

function createTestFile (test, refs, commands) {


  function getModeValue(value) {
    let v = value.trim().toLowerCase();
    if (!validModes.includes(v)) {
        addTestError(test.testId, '"' + value + '" is not valid value for "mode" property.')
    }
    return v;
  }

  function getTask(t) {
    let task = t.replace(/'/g, '').replace(/;/g, '').trim().toLowerCase();

    if (typeof commands[task] !== 'object') {
      addTestError(test.testId, '"' + task + '" does not exist in commands.csv file.')
    }

    return task;
  }

  function getAppliesToValues(values) {

    function checkValue(value) {
      let v1 = value.trim().toLowerCase();
      for (let i=0; i < validAppliesTo.length; i++) {
        let v2 = validAppliesTo[i];
        if (v1 === v2.toLowerCase()) {
          return v2;
        }
      };
      return false;
    }

    // check for individual assistive technologies

    let items = values.split(',');
    let str = '[';
    items.forEach(function (item) {
      let value = checkValue(item);
      if (!value) {
        addTestError(test.testId, '"' + item + '" is not valid value for "appliesTo" property.')
      }
      str += '"' + value + '"';
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

  function getReferences (example, testRefs) {
    let links = '';

    if (typeof example === 'string' && example.length) {
      links += `<link rel="help" href="${refs.example}">\n`;
    }

    let items = test.refs.split(' ');
    items.forEach(function(item) {
      item = item.trim();

      if (item.length) {
        if (typeof refs[item] === 'string') {
          links += `<link rel="help" href="${refs[item]}">\n`;
        }
        else {
          addTestError(test.testId, "Reference does not exist: " + item);
        }
      }
    });

    return links;
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

  function getSetupScriptDescription(desc) {
    let str = '';
    if (typeof desc === 'string') {
      let d = desc.trim();
      if (d.length) {
        str = `\n    setup_script_description: "${d}",\n    `;
      }
    }

    return str;
  }

  let assertions = '';
  let setupFileName = '';
  let testFileName = test.task.replace(/'/g, '').replace(/;/g, '').replace(/\s+/g, '-').toLowerCase() + '-' + test.mode + '.html';
  let testFileAbsolute = path.join(testDirectory, testFileName);

  if (typeof test.setupScript === 'string') {
    let setupScript = test.setupScript.trim();
    if (setupScript.length) {
      setupFileName = path.join(javascriptDirectory, test.setupScript + '.js');
    }
  }

  let task        = getTask(test.task);
  let references  = getReferences(refs.example, test.refs);
  let mode        = getModeValue(test.mode);
  let appliesTo   = getAppliesToValues(test.appliesTo);
  let setupScript = getSetupScript(setupFileName);
  let setupScriptDescription = getSetupScriptDescription(test.setupScriptDescription);

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

  verifyATBehavior({${setupScriptDescription}${setupScript}
    applies_to: ${appliesTo},
    mode: "${mode}",
    task: "${task}",
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

function addCommandError(task, key) {
  errorCount += 1;
  errors += '[Command]: The key reference "' + key + '" is invalid for the "' + task + '" task.\n';
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
              console.log('\n\n*** ' + errorCount + ' Errors in tests and/or commands ***');
              console.log(errors);
            }
            else {
              console.log('No validation errors detected');
            }
          });
      });
  });

