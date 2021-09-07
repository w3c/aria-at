/// <reference path="../types/aria-at-csv.js" />
/// <reference path="../types/aria-at-parsed.js" />
/// <reference path="../types/aria-at-validated.js" />
/// <reference path="../types/aria-at-file.js" />

'use strict';
const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const csv = require('csv-parser');
const beautify = require('json-beautify');

const {reindent} = require('../lib/lines');
const {Queryable} = require('../lib/queryable');

let VERBOSE_CHECK = false;
let VALIDATE_CHECK = false;

let suppressedMessages = 0;

/**
 * @param {string} message - message to be logged
 * @param {boolean} severe=false - indicates whether the message should be viewed as an error or not
 * @param {boolean} force=false - indicates whether this message should be forced to be outputted regardless of verbosity level
 */
const logger = (message, severe = false, force = false) => {
  if (VERBOSE_CHECK || force) {
    if (severe) console.error(message)
    else console.log(message)
  } else {
    // Output no logs
    suppressedMessages += 1; // counter to indicate how many messages were hidden
  }
}

/**
 * @param {string} directory - path to directory of data to be used to generate test
 * @param {object} args={}
 */
const createExampleTests = ({directory, args = {}}) => new Promise(resolve => {
  // setup from arguments passed to npm script
  VERBOSE_CHECK = !!args.verbose;
  VALIDATE_CHECK = !!args.validate;

  const validModes = ['reading', 'interaction', 'item'];

  // cwd; @param rootDirectory is dependent on this file not moving from the scripts folder
  const scriptsDirectory = path.dirname(__filename);
  const rootDirectory = scriptsDirectory.split('scripts')[0];

  const testsDirectory = path.join(rootDirectory, 'tests');
  const testPlanDirectory = path.join(rootDirectory, directory);

  const resourcesDirectory = path.join(testsDirectory, 'resources');

  const ariaAtHarnessFilePath = path.join(resourcesDirectory, 'aria-at-harness.mjs');
  const ariaAtTestIoFormatFilePath = path.join(resourcesDirectory, 'aria-at-test-io-format.mjs');
  const ariaAtTestRunFilePath = path.join(resourcesDirectory, 'aria-at-test-run.mjs');
  const ariaAtTestWindowFilePath = path.join(resourcesDirectory, 'aria-at-test-window.mjs');
  const atCommandsFilePath = path.join(resourcesDirectory, 'at-commands.mjs');
  const keysFilePath = path.join(resourcesDirectory, 'keys.mjs');
  const vrenderFilePath = path.join(resourcesDirectory, 'vrender.mjs');

  const supportFilePath = path.join(testsDirectory, 'support.json');
  const javascriptDirectory = path.join(testPlanDirectory, 'data', 'js');
  const testsCsvFilePath = path.join(testPlanDirectory, 'data', 'tests.csv');
  const atCommandsCsvFilePath = path.join(testPlanDirectory, 'data', 'commands.csv');
  const referencesCsvFilePath = path.join(testPlanDirectory, 'data', 'references.csv');
  const referenceDirectory = path.join(testPlanDirectory, 'reference')

  // build output folders and file paths setup
  const buildDirectory = path.join(rootDirectory, 'build');
  const testsBuildDirectory = path.join(buildDirectory, 'tests');
  const testPlanBuildDirectory = path.join(buildDirectory, directory);
  const resourcesBuildDirectory = path.join(testsBuildDirectory, 'resources');
  const referenceBuildDirectory = path.join(testPlanBuildDirectory, 'reference');

  const indexFileBuildOutputPath = path.join(testPlanBuildDirectory, 'index.html');
  const supportFileBuildPath = path.join(testsBuildDirectory, 'support.json');

  const ariaAtHarnessFileBuildPath = path.join(resourcesBuildDirectory, 'aria-at-harness.mjs');
  const ariaAtTestIoFormatFileBuildPath = path.join(resourcesBuildDirectory, 'aria-at-test-io-format.mjs');
  const ariaAtTestRunFileBuildPath = path.join(resourcesBuildDirectory, 'aria-at-test-run.mjs');
  const ariaAtTestWindowFileBuildPath = path.join(resourcesBuildDirectory, 'aria-at-test-window.mjs');
  const atCommandsFileBuildPath = path.join(resourcesBuildDirectory, 'at-commands.mjs');
  const keysFileBuildPath = path.join(resourcesBuildDirectory, 'keys.mjs');
  const vrenderFileBuildPath = path.join(resourcesBuildDirectory, 'vrender.mjs');

  // create directories if not exists
  fs.existsSync(buildDirectory) || fs.mkdirSync(buildDirectory);
  fs.existsSync(testsBuildDirectory) || fs.mkdirSync(testsBuildDirectory);
  fs.existsSync(testPlanBuildDirectory) || fs.mkdirSync(testPlanBuildDirectory);
  fs.existsSync(resourcesBuildDirectory) || fs.mkdirSync(resourcesBuildDirectory);

  // ensure the build folder has the files it needs for running local server
  fse.copySync(supportFilePath, supportFileBuildPath, {overwrite: true});

  fse.copySync(ariaAtHarnessFilePath, ariaAtHarnessFileBuildPath, {overwrite: true});
  fse.copySync(ariaAtTestIoFormatFilePath, ariaAtTestIoFormatFileBuildPath, {overwrite: true});
  fse.copySync(ariaAtTestRunFilePath, ariaAtTestRunFileBuildPath, {overwrite: true});
  fse.copySync(ariaAtTestWindowFilePath, ariaAtTestWindowFileBuildPath, {overwrite: true});
  fse.copySync(atCommandsFilePath, atCommandsFileBuildPath, {overwrite: true});
  fse.copySync(keysFilePath, keysFileBuildPath, {overwrite: true});
  fse.copySync(vrenderFilePath, vrenderFileBuildPath, {overwrite: true});

  fse.copySync(referenceDirectory, referenceBuildDirectory, {overwrite: true});

  const keyDefs = {};
  const support = JSON.parse(fse.readFileSync(supportFilePath));

  let allATKeys = [];
  let allATNames = [];
  support.ats.forEach(at => {
    allATKeys.push(at.key);
    allATNames.push(at.name);
  });

  const validAppliesTo = ['Screen Readers', 'Desktop Screen Readers'].concat(allATKeys);

  try {
    fse.statSync(testPlanDirectory);
  } catch (err) {
    logger(`The test directory '${testPlanDirectory}' does not exist. Check the path to tests.`, true, true);
    process.exit();
  }

  try {
    fse.statSync(testsCsvFilePath);
  } catch (err) {
    logger(`The tests.csv file does not exist. Please create '${testsCsvFilePath}' file.`, true, true);
    process.exit();
  }

  try {
    fse.statSync(atCommandsCsvFilePath);
  } catch (err) {
    logger(`The at-commands.csv file does not exist. Please create '${atCommandsCsvFilePath}' file.`, true, true);
    process.exit();
  }

  try {
    fse.statSync(referencesCsvFilePath);
  } catch (err) {
    logger(`The references.csv file does not exist. Please create '${referencesCsvFilePath}' file.`, true, true);
    process.exit();
  }

  // get Keys that are defined
  try {
    // read contents of the file
    const keys = fs.readFileSync(keysFilePath, 'UTF-8');

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
    logger(err, true, true);
  }

  // delete test files
  var deleteFilesFromDirectory = function (dirPath) {
    try {
      var files = fs.readdirSync(dirPath);
    } catch (e) {
      return;
    }
    if (files.length > 0) {
      for (var i = 0; i < files.length; i++) {
        var filePath = dirPath + '/' + files[i];
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      }
    }
  };

  function cleanTask(task) {
    return task.replace(/'/g, '').replace(/;/g, '').trim().toLowerCase()
  }

  /**
   * Create AT commands file
   * @param commands
   * @returns {{}}
   */
  function createATCommandFile(commands) {
    const testPlanAtCommandsJsonFilePath = path.join(testPlanBuildDirectory, 'commands.json');
    let data = {};

    function addCommand(task, mode, at, key) {

      task = cleanTask(task);
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

      if (typeof data[task][mode][at] !== 'object') {
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

    commands.forEach(function (command) {
      addCommand(command.task, command.mode, command.at, command.commandA);
      addCommand(command.task, command.mode, command.at, command.commandB);
      addCommand(command.task, command.mode, command.at, command.commandC);
      addCommand(command.task, command.mode, command.at, command.commandD);
      addCommand(command.task, command.mode, command.at, command.commandE);
      addCommand(command.task, command.mode, command.at, command.commandF);
    });

    if (!VALIDATE_CHECK) fs.writeFileSync(testPlanAtCommandsJsonFilePath, beautify(data, null, 2, 40));

    return data;
  }

  /**
   * Create Test File
   * @param test
   * @param refs
   * @param commands
   * @returns {(string|*[])[]}
   */
  function createTestFile(test, refs, commands) {
    let scripts = [];

    function getModeValue(value) {
      let v = value.trim().toLowerCase();
      if (!validModes.includes(v)) {
        addTestError(test.testId, '"' + value + '" is not valid value for "mode" property.')
      }
      return v;
    }

    function getTask(t) {
      let task = cleanTask(t);

      if (typeof commands[task] !== 'object') {
        addTestError(test.testId, '"' + task + '" does not exist in commands.csv file.')
      }

      return task;
    }

    function getAppliesToValues(values) {
      function checkValue(value) {
        let v1 = value.trim().toLowerCase();
        for (let i = 0; i < validAppliesTo.length; i++) {
          let v2 = validAppliesTo[i];
          if (v1 === v2.toLowerCase()) {
            return v2;
          }
        }
        return false;
      }

      // check for individual assistive technologies
      let items = values.split(',');
      let newValues = [];
      items.filter(item => {
        let value = checkValue(item);
        if (!value) {
          addTestError(test.testId, '"' + item + '" is not valid value for "appliesTo" property.')
        }

        newValues.push(value);
      });

      return newValues;
    }

    /**
     * Determines priority level (default is 1) of assertion string, then adds it to the collection of assertions for
     * the test plan
     * @param {string} a - Assertion string to be evaluated
     */
    function addAssertion(a) {
      let level = '1';
      let str = a;
      a = a.trim();

      // matches a 'colon' when preceded by either of the digits 1 OR 2 (SINGLE CHARACTER), at the start of the string
      let parts = a.split(/(?<=^[1-2]):/g);

      if (parts.length === 2) {
        level = parts[0];
        str = parts[1].substring(0);
        if ((level !== '1') && (level !== '2')) {
          addTestError(test.testId, "Level value must be 1 or 2, value found was '" + level + "' for assertion '" + str + "' (NOTE: level 2 defined for this assertion).");
          level = '2';
        }
      }

      if (a.length) {
        assertions.push([level, str]);
      }
    }

    function getReferences(example, testRefs) {
      let links = '';

      if (typeof example === 'string' && example.length) {
        links += `<link rel="help" href="${refs.example}">\n`;
      }

      let items = test.refs.split(' ');
      items.forEach(function (item) {
        item = item.trim();

        if (item.length) {
          if (typeof refs[item] === 'string') {
            links += `<link rel="help" href="${refs[item]}">\n`;
          } else {
            addTestError(test.testId, "Reference does not exist: " + item);
          }
        }
      });

      return links;
    }

    function addSetupScript(scriptName, filename) {
      let script = '';
      if (filename.length) {
        try {
          fse.statSync(filename);
        } catch (err) {
          addTestError(test.testId, "Setup script does not exist: " + filename);
          return '';
        }

        try {
          const data = fs.readFileSync(filename, 'UTF-8');
          const lines = data.split(/\r?\n/);
          lines.forEach((line) => {
            if (line.trim().length)
              script += '\t\t\t' + line.trim() + '\n';
          });
        } catch (err) {
          logger(err, true, true);
        }

        scripts.push(`\t\t${scriptName}: function(testPageDocument){\n${script}\t\t}`);
      }

      return script;
    }

    function getSetupScriptDescription(desc) {
      let str = '';
      if (typeof desc === 'string') {
        let d = desc.trim();
        if (d.length) {
          str = d;
        }
      }

      return str;
    }

    function getScripts() {
      let js = 'var scripts = {\n';
      js += scripts.join(',\n');
      js += '\n\t};';
      return js;
    }

    let task = getTask(test.task);
    let appliesTo = getAppliesToValues(test.appliesTo);
    let mode = getModeValue(test.mode);

    appliesTo.forEach(at => {
      if (commands[task]) {
        if (!commands[task][mode][at.toLowerCase()]) {
          addTestError(test.testId, 'command is missing for the combination of task: "' + task + '", mode: "' + mode + '", and AT: "' + at.toLowerCase() + '" ');
        }
      }
    });

    let assertions = [];
    let setupFileName = '';
    let id = test.testId;
    if (parseInt(test.testId) < 10) {
      id = '0' + id;
    }
    let testFileName = 'test-' + id + '-' + cleanTask(test.task).replace(/\s+/g, '-') + '-' + test.mode.trim()
      .toLowerCase() + '.html';
    let testJSONFileName = 'test-' + id + '-' + cleanTask(test.task).replace(/\s+/g, '-') + '-' + test.mode.trim()
      .toLowerCase() + '.json';

    let testPlanHtmlFileBuildPath = path.join(testPlanBuildDirectory, testFileName);
    let testPlanJsonFileBuildPath = path.join(testPlanBuildDirectory, testJSONFileName);

    if (typeof test.setupScript === 'string') {
      let setupScript = test.setupScript.trim();
      if (setupScript.length) {
        setupFileName = path.join(javascriptDirectory, test.setupScript + '.js');
      }
    }

    let references = getReferences(refs.example, test.refs);
    addSetupScript(test.setupScript, setupFileName);

    for (let i = 1; i < 31; i++) {
      if (!test["assertion" + i]) {
        continue;
      }
      addAssertion(test["assertion" + i]);
    }

    /** @type {AriaATFile.Behavior} */
    let testData = {
      setup_script_description: getSetupScriptDescription(test.setupScriptDescription),
      setupTestPage: test.setupScript,
      applies_to: appliesTo,
      mode: mode,
      task: task,
      specific_user_instruction: test.instructions,
      output_assertions: assertions
    };

    if (!VALIDATE_CHECK) fse.writeFileSync(testPlanJsonFileBuildPath, JSON.stringify(testData, null, 2), 'utf8');

    function getTestJson() {
      return JSON.stringify(testData, null, 2);
    }

    function getCommandsJson() {
      return beautify({[task]: commands[task]}, null, 2, 40);
    }

    let testHTML = `
<!DOCTYPE html>
<meta charset="utf-8">
<title>${test.title}</title>
${references}
<script>
  ${getScripts()}
</script>
<script type="module">
  import { initialize, verifyATBehavior, displayTestPageAndInstructions } from "../resources/aria-at-harness.mjs";

  new Promise((resolve) => {
    fetch('../support.json')
      .then(response => resolve(response.json()))
    })
  .then(supportJson => {
    const testJson = ${getTestJson()};
    const commandJson = ${getCommandsJson()};
    initialize(supportJson, commandJson);
    verifyATBehavior(testJson);
    displayTestPageAndInstructions("${refs.reference}");
  });
</script>
  `;

    if (!VALIDATE_CHECK) fse.writeFileSync(testPlanHtmlFileBuildPath, testHTML, 'utf8');

    /** @type {AriaATFile.CollectedTest} */
    const collectedTest = {};

    const applies_to_at = [];

    allATKeys.forEach(at => applies_to_at.push(testData.applies_to.indexOf(at) >= 0));

    return [testFileName, applies_to_at];
  }

  /**
   * Create an index file for a local server
   * @param tasks
   */
  function createIndexFile(tasks) {
    let rows = '';
    let all_ats = '';

    allATNames.forEach(at => all_ats += '<th>' + at + '</th>\n');

    tasks.forEach(function (task) {
      rows += `<tr><td>${task.id}</td>`;
      rows += `<td scope="row">${task.title}</td>`;
      for (let i = 0; i < allATKeys.length; i++) {
        if (task.applies_to_at[i]) {
          rows += `<td class="test"><a href="${task.href}?at=${allATKeys[i]}" aria-label="${allATNames[i]} test for task ${task.id}">${allATNames[i]}</a></td>`;
        } else {
          rows += `<td class="test none">not included</td>`;
        }
      }
      rows += `<td>${task.script}</td></tr>\n`
    });

    let indexHTML = `
<!DOCTYPE html>
<meta charset="utf-8">
<head>
  <title>Index of Assistive Technology Test Files</title>
  <style>
    table {
      display: table;
      border-collapse: collapse;
      border-spacing: 2px;
      border-color: gray;
    }

    thead {
      display: table-row-group;
      vertical-align: middle;
      border-bottom: black solid 2px;
    }

    tbody {
      display: table-row-group;
      vertical-align: middle;
      border-color: gray;
    }

    tr:nth-child(even) {background: #DDD}
    tr:nth-child(odd) {background: #FFF}

    tr {
      display: table-row;
      vertical-align: inherit;
      border-color: gray;
    }

    td {
      padding: 3px;
      display: table-cell;
    }

    td.test {
      text-align: center;
    }

    td.none {
      color: #333;
    }

    th {
      padding: 3px;
      font-weight: bold;
      display: table-cell;
    }
  </style>
</head>
<body>
 <main>
  <h1>Index of Assistive Technology Test Files</h1>
  <p>This is useful for viewing the local files on a local web server and provides links that will work when the local version of the
  test runner is being executed, using <code>npm run start</code> from the root directory: <code>${rootDirectory}</code>.</p>
  <table>
    <thead>
      <tr>
        <th>Task ID</th>
        <th>Testing Task</th>
        ${all_ats}
        <th>Setup Script Reference</th>
      </tr>
    </thead>
    <tbody>
${rows}
    </tbody>
  </table>
  </main>
</body>
`;

    if (!VALIDATE_CHECK) fse.writeFileSync(indexFileBuildOutputPath, indexHTML, 'utf8');
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

  const refRows = [];

  fs.createReadStream(referencesCsvFilePath)
    .pipe(csv())
    .on('data', (row) => {
      refRows.push(row);
      refs[row.refId] = row.value.trim();
    })
    .on('end', () => {
      logger(`References CSV file successfully processed: ${referencesCsvFilePath}`);

      fs.createReadStream(atCommandsCsvFilePath)
        .pipe(csv())
        .on('data', (row) => {
          atCommands.push(row);
        })
        .on('end', () => {
          logger(`Commands CSV file successfully processed: ${atCommandsCsvFilePath}`);

          fs.createReadStream(testsCsvFilePath)
            .pipe(csv())
            .on('data', (row) => {
              tests.push(row);
            })
            .on('end', () => {
              logger(`Test CSV file successfully processed: ${testsCsvFilePath}`);

              logger('Deleting current test files...')
              deleteFilesFromDirectory(testPlanDirectory);

              const scripts = loadScripts(path.join(testPlanDirectory, 'data', 'js'));

              const commandsParsed = atCommands.map(parseCommandCSVRow);
              const testsParsed = tests.map(parseTestCSVRow);
              const referencesParsed = parseRefencesCSV(refRows);
              const keysParsed = parseKeyMap(keyDefs);
              const supportParsed = parseSupport(support);

              const keysValidated = validateKeyMap(keysParsed, {addKeyMapError(reason) {
                errorCount += 1;
                errors += `[resources/keys.mjs]: ${reason}\n`;
              }});

              const supportQueryables = {
                at: Queryable.from('at', supportParsed.ats),
                atGroup: Queryable.from('atGroup', supportParsed.atGroups),
              };
              const keyQueryable = Queryable.from('key', keysValidated);
              const commandLookups = {
                key: keyQueryable,
                support: supportQueryables,
              };
              const commandsValidated = commandsParsed.map(command => validateCommand(command, commandLookups, {addCommandError}));

              const referenceQueryable = Queryable.from('reference', referencesParsed);
              const testLookups = {
                command: Queryable.from('command', commandsValidated),
                mode: Queryable.from('mode', validModes),
                reference: referenceQueryable,
                script: Queryable.from('script', scripts),
                support: supportQueryables,
              };
              const testsValidated = testsParsed.map((test) =>
                validateTest(test, testLookups, {
                  addTestError: addTestError.bind(null, test.testId),
                })
              );

              const commandQueryable = Queryable.from('command', commandsValidated);
              const testsCollected = testsValidated.flatMap(test => {
                return test.target.at.map(({key}) => collectTestData({
                  test,
                  command: commandQueryable.where({testId: test.testId, target: {at: {key}}}),
                  reference: referenceQueryable,
                  key: keyQueryable,
                }));
              });

              const files = [
                ...createScriptFiles(scripts, testPlanBuildDirectory),
                ...testsCollected.map(collectedTest => (
                  createCollectedTestFile(collectedTest, testPlanBuildDirectory)
                )),
                ...testsCollected.map(collectedTest => (
                  createCollectedTestHtmlFile(collectedTest, testPlanBuildDirectory)
                ))
              ];

              if (!VALIDATE_CHECK) {
                files.forEach(file => {
                  fs.mkdirSync(path.dirname(file.path), {recursive: true});
                  fs.writeFileSync(file.path, file.content);
                });
              }

              atCommands = createATCommandFile(atCommands);

              logger('Creating the following test files: ')
              tests.forEach(function (test) {
                try {
                  let [url, applies_to_at] = createTestFile(test, refs, atCommands);
                  indexOfURLs.push({
                    id: test.testId,
                    title: test.title,
                    href: url,
                    script: test.setupScript,
                    applies_to_at: applies_to_at
                  });
                  logger('[Test ' + test.testId + ']: ' + url);
                } catch (err) {
                  logger(err, true, true);
                }
              });

              createIndexFile(indexOfURLs);

              if (errorCount) {
                logger(`*** ${errorCount} Errors in tests and/or commands in file [${testsCsvFilePath}] ***`, true, true);
                logger(errors, true, true);
                resolve({isSuccessfulRun: false, suppressedMessages});
              } else {
                logger('No validation errors detected\n');
                resolve({isSuccessfulRun: true, suppressedMessages});
              }
            })
        })
    })
});

/**
 * @param {string} testPlanJsDirectory
 * @returns {AriaATFile.ScriptSource[]}
 */
function loadScripts(testPlanJsDirectory) {
  return fs.readdirSync(testPlanJsDirectory)
    .map((scriptFileName) => {
      const name = path.basename(scriptFileName, '.js');
      const source = fs.readFileSync(path.join(testPlanJsDirectory, scriptFileName), 'utf-8');
      const modulePath = path.posix.join('scripts', `${name}.module.js`);
      const jsonpPath = path.posix.join('scripts', `${name}.jsonp.js`);

      /** @type {AriaATFile.ScriptSource} */
      return {
        name,
        source,
        modulePath,
        jsonpPath,
      };
    });
}

/**
 * @param {AriaATFile.ScriptSource[]} scripts
 * @param {string} testPlanBuildDirectory
 * @returns {{path: string, content: string}[]}
 */
function createScriptFiles(scripts, testPlanBuildDirectory) {
  const jsonpFunction = 'scriptsJsonpLoaded';

  return [
    ...scripts.reduce((files, script) => {
      const {modulePath, jsonpPath} = script;
      const oneScript = [script];

      return [...files, ...renderFileVariants(oneScript, modulePath, jsonpPath)];
    }, []),
    ...renderFileVariants(
      scripts,
      'scripts.module.js',
      'scripts.jsonp.js'
    ),
  ];

  function renderFileVariants(scripts, modulePath, jsonpPath) {
    return [{
      path: path.join(testPlanBuildDirectory, modulePath),
      content: renderModule(scripts).toString(),
    }, {
      path: path.join(testPlanBuildDirectory, jsonpPath),
      content: renderJsonp(scripts).toString(),
    }];
  }

  function renderJsonp(scripts) {
    return reindent`window[document.currentScript.getAttribute("jsonpFunction") || "${jsonpFunction}"]({
  ${scripts.map(renderJsonpExport).join(',\n')}
});
`;
  }

  function renderJsonpExport({name, source}) {
    return reindent`${name}(testPageDocument) {
  ${source.trim()}
}`;
  }

  function renderModule(scripts) {
    return reindent`${scripts.map(renderModuleExport).join('\n\n')}
`;
  }

  function renderModuleExport({name, source}) {
    return reindent`export function ${name}(testPageDocument) {
  ${source.trim()}
}`;
  }
}

/**
 * @param {AriaATCSV.Command} commandRow
 * @returns {AriaATParsed.Command}
 */
function parseCommandCSVRow(commandRow) {
  return {
    testId: Number(commandRow.testId),
    task: commandRow.task.replace(/[';]/g, '').trim().toLowerCase(),
    target: {
      at: {
        key: commandRow.at.trim().toLowerCase(),
        raw: commandRow.at,
      },
      mode: commandRow.mode.trim().toLowerCase(),
    },
    commands: [
      commandRow.commandA,
      commandRow.commandB,
      commandRow.commandC,
      commandRow.commandD,
      commandRow.commandE,
      commandRow.commandF,
    ]
      .filter(Boolean)
      .map(command => {
        const paranIndex = command.indexOf('(');
        if (paranIndex >= 0) {
          return {
            id: command.substring(0, paranIndex).trim(),
            extraInstruction: command.substring(paranIndex).trim(),
          };
        }
        return {
          id: command.trim(),
        };
      }),
  }
}

/**
 * @param {Object<string, string>} keyLines
 * @returns {AriaATParsed.KeyMap}
 */
function parseKeyMap(keyDefs) {
  const keyMap = {};
  for (const id in keyDefs) {
    keyMap[id] = {id, keystroke: keyDefs[id]};
  }
  return keyMap;
}

/**
 * @param {AriaATCSV.Reference[]} referenceRows
 * @returns {AriaATParsed.ReferenceMap}
 */
function parseRefencesCSV(referenceRows) {
  const refMap = {};
  for (const {refId, value} of referenceRows) {
    refMap[refId] = ({refId, value: value.trim()});
  }
  return refMap;
}

/**
 * @param {AriaATCSV.Support} supportRaw
 * @returns {AriaATParsed.Support}
 */
function parseSupport(supportRaw) {
  return {
    ats: supportRaw.ats,
    atGroups: [
      ...Object.entries(supportRaw.applies_to).map(([name, value]) => (
        {
          key: name.toLowerCase(),
          name,
          ats: value.map(key => supportRaw.ats.find(at => at.key === key) || {key})
        }
      )),
      ...supportRaw.ats.map(at => ({key: at.key, name: at.name, ats: [at]})),
    ],
  };
}

/**
 * @param {AriaATCSV.Test} testRow
 * @returns {AriaATParsed.Test}
 */
function parseTestCSVRow(testRow) {
  return {
    testId: Number(testRow.testId),
    task: testRow.task.replace(/[';]/g, "").trim().toLowerCase(),
    title: testRow.title,
    references: testRow.refs
      .split(" ")
      .map((raw) => raw.trim().toLowerCase())
      .filter(Boolean)
      .map((refId) => ({ refId })),
    target: {
      at: testRow.appliesTo
        .split(",")
        .map((raw) => ({
          key: raw.trim().toLowerCase().replace(" ", "_"),
          raw,
        })),
      mode: testRow.mode.trim().toLowerCase(),
    },
    setupScript: testRow.setupScript
      ? {
          name: testRow.setupScript,
          description: testRow.setupScriptDescription,
        }
      : undefined,
    instructions: {
      user: testRow.instructions
        .split("|")
        .map((instruction) => instruction.trim()),
      raw: testRow.instructions,
    },
    assertions: [
      testRow.assertion1,
      testRow.assertion2,
      testRow.assertion3,
      testRow.assertion4,
      testRow.assertion5,
      testRow.assertion6,
      testRow.assertion7,
      testRow.assertion8,
      testRow.assertion9,
      testRow.assertion10,
      testRow.assertion11,
      testRow.assertion12,
      testRow.assertion13,
      testRow.assertion14,
      testRow.assertion15,
      testRow.assertion16,
      testRow.assertion17,
      testRow.assertion18,
      testRow.assertion19,
      testRow.assertion20,
      testRow.assertion21,
      testRow.assertion22,
      testRow.assertion23,
      testRow.assertion24,
      testRow.assertion25,
      testRow.assertion26,
      testRow.assertion27,
      testRow.assertion28,
      testRow.assertion29,
      testRow.assertion30,
    ]
      .filter(Boolean)
      .map((assertion) => {
        const colonMatch = /^([12]):/.exec(assertion);
        if (colonMatch) {
          const priority = Number(colonMatch[1]);
          return {
            priority: Number.isNaN(priority) ? colonMatch[1] : priority,
            expectation: assertion.substring(assertion.indexOf(":") + 1).trim(),
          };
        }
        return {
          priority: 1,
          expectation: assertion.trim(),
        };
      }),
  };
}

/**
 * @param {AriaATParsed.Command} commandParsed
 * @param {object} data
 * @param {Queryable<AriaATParsed.Key>} data.key
 * @param {object} [options]
 * @param {function(string, string): void} [options.addCommandError]
 * @returns {AriaATValidated.Command}
 */
function validateCommand(commandParsed, data, {addCommandError = () => {}} = {}) {
  return {
    ...commandParsed,
    target: {
      ...commandParsed.target,
      at: {
        ...commandParsed.target.at,
        ...map(data.support.at.where({key: commandParsed.target.at.key}), ({name}) => ({name})),
      }
    },
    commands: commandParsed.commands.map(command => {
      const key = data.key.where({id: command.id});
      if (!key) {
        addCommandError(commandParsed.task, command.id);
      }
      return {
        ...key,
        ...command,
      };
    }),
  }
}

// function where(goal, value) {
//   if (typeof goal === 'object') {
//     if (Array.isArray(goal)) {

//     }
//     for (const key of Object.keys(goal)) {

//     }
//   }
// }

/**
 *
 * @param {*} goal
 * @returns {function(*): boolean}
 */
function where2(goal) {
  if (typeof goal === 'object' && goal !== null) {
    if (Array.isArray(goal)) {
      throw new Error();
    }
    const keyChecks = Object.entries(goal).map(([key, value]) => {
      const check = where2(value);
      const get = target => target[key];
      return target => check(get(target));
    });
    const isObject = target => typeof target === 'object' && !Array.isArray(target);
    const allChecks = [isObject, ...keyChecks];
    return target => allChecks.every(check => check(target));
  } else if (typeof goal === 'function') {
    throw new Error();
  }
  return target => target === goal;
}

// function extract(goal, target) {
//   if (typeof goal !== 'object' || goal === null) {
//     throw new Error();
//   } else if (!Array.isArray(goal)) {
//     throw new Error();
//   }
//   const obj = {};
//   for (const key of goal) {
//     if (typeof key === 'object') {
//       if (!Array.isArray(key)) {
//         throw new Error();
//       } else if (key.length !== 2) {
//         throw new Error();
//       } else if (typeof key[0] !== 'string') {
//         throw new Error();
//       }
//       obj[key[0]] = extract(key[1], target[key[0]]);
//     } else if (typeof key === 'string') {
//       obj[key] = target[key];
//     } else {
//       throw new Error();
//     }
//   }
//   return obj;
// }

/**
 * @param {AriaATParsed.KeyMap} keyMap
 */
function validateKeyMap(keyMap, {addKeyMapError}) {
  if (!keyMap.ALT_DELETE) {
    addKeyMapError(`ALT_DELETE is not defined in keys module.`);
  }
  if (!keyMap.INS_Z) {
    addKeyMapError(`INS_Z is not defined in keys module.`);
  }
  if (!keyMap.ESC) {
    addKeyMapError(`ESC is not defined in keys module.`);
  }
  if (!keyMap.INS_SPACE) {
    addKeyMapError(`INS_SPACE is not defined in keys module.`);
  }
  if (!keyMap.LEFT) {
    addKeyMapError(`LEFT is not defined in keys module.`);
  }
  if (!keyMap.RIGHT) {
    addKeyMapError(`RIGHT is not defined in keys module.`);
  }
  return keyMap;
}


const MODE_INSTRUCTION_TEMPLATES = {
  jaws: {
    reading: (data) => {
      const altDelete = data.key.where({id: 'ALT_DELETE'});
      const insZ = data.key.where({id: 'INS_Z'});
      return `Verify the Virtual Cursor is active by pressing ${altDelete.keystroke}. If it is not, turn on the Virtual Cursor by pressing ${insZ.keystroke}.`;
    },
    interaction: (data) => {
      const altDelete = data.key.where({id: 'ALT_DELETE'});
      const insZ = data.key.where({id: 'INS_Z'});
      return `Verify the PC Cursor is active by pressing ${altDelete.keystroke}. If it is not, turn off the Virtual Cursor by pressing ${insZ.keystroke}.`;
    },
  },
  nvda: {
    reading: (data) => {
      const esc = data.key.where({id: 'ESC'});
      return `Insure NVDA is in browse mode by pressing ${esc.keystroke}. Note: This command has no effect if NVDA is already in browse mode.`;
    },
    interaction: (data) => {
      const insSpace = data.key.where({id: 'INS_SPACE'});
      return `If NVDA did not make the focus mode sound when the test page loaded, press ${insSpace.keystroke} to turn focus mode on.`;
    }
  },
  voiceover_macos: {
    reading: (data) => {
      const left = data.key.where({id: 'LEFT'});
      const right = data.key.where({id: 'RIGHT'});
      return `Toggle Quick Nav ON by pressing the ${left.keystroke} and ${right.keystroke} keys at the same time.`;
    },
    interaction: (data) => {
      const left = data.key.where({id: 'LEFT'});
      const right = data.key.where({id: 'RIGHT'});
      return `Toggle Quick Nav OFF by pressing the ${left.keystroke} and ${right.keystroke} keys at the same time.`;
    }
  }
};

/**
 * @param {T} value
 * @param {function(T): U} goal
 * @returns {T}
 * @template T
 * @template {T} U
 */
function map(value, goal) {
  if (value) {
    return goal(value);
  }
  return value;
}

/**
 * @param {AriaATParsed.Test} testParsed
 * @param {object} data
 * @param {Queryable<AriaATParsed.Command>} data.command
 * @param {Queryable<AriaATParsed.Key>} data.key
 * @param {Queryable<string>} data.mode
 * @param {Queryable<AriaATParsed.Reference>} data.reference
 * @param {Queryable<AriaATParsed.ScriptSource>} data.script
 * @param {object} data.support
 * @param {Queryable<{key: string, name: string}>} data.support.at
 * @param {Queryable<{key: string, name: string}>} data.support.atGroup
 * @param {object} [options]
 * @param {function(string): void} [options.addTestError]
 * @returns {AriaATValidated.Test}
 */
function validateTest(testParsed, data, {addTestError = () => {}} = {}) {
  if (!data.command.where({task: testParsed.task})) {
    addTestError(`"${testParsed.task}" does not exist in commands.csv file.`);
  }

  testParsed.target.at
    .forEach(at => {
      if (!data.support.atGroup.where({key: at.key})) {
        addTestError(`"${at.key}" is not valid value for "appliesTo" property.`);
      }

      if (!data.command.where({
        task: testParsed.task,
        target: {
          at: {key: at.key},
          mode: testParsed.target.mode
        }
      })) {
        addTestError(`command is missing for the combination of task: "${testParsed.task}", mode: "${testParsed.target.mode}", and AT: "${at.key}"`);
      }
    });

  if (!data.mode.where(testParsed.target.mode)) {
    addTestError(`"${testParsed.target.mode}" is not valid value for "mode" property.`);
  }

  const references = testParsed.references
    .filter(({refId}) => {
      if (!data.reference.where({refId})) {
        addTestError(`Reference does not exist: ${refId}`);
        return false;
      }
      return true;
    });

  if (testParsed.setupScript && !data.script.where({name: testParsed.setupScript.name})) {
    addTestError(`Setup script does not exist: ${testParsed.setupScript.name}`);
  }

  const assertions = testParsed.assertions
    .map(assertion => {
      if (typeof assertion.priority === 'string' || assertion.priority !== 1 && assertion.priority !== 2) {
        addTestError(`Level value must be 1 or 2, value found was "${assertion.priority}" for assertion "${assertion.expectation}" (NOTE: level 2 defined for this assertion).`);
        return {
          priority: 2,
          expectation: assertion.expectation,
        };
      }
      return assertion;
    });

  return {
    ...testParsed,
    references: [
      ...[data.reference.where({refId: 'example'})].filter(Boolean),
      ...references,
    ]
      .map(ref => ({
        ...ref,
        ...data.reference.where({refId: ref.refId}),
      })),
    target: {
      at: testParsed.target.at.map(at => ({
        ...at,
        ...map(data.support.at.where({key: at.key}), ({name}) => ({name})),
      })),
      mode: testParsed.target.mode,
    },
    setupScript: testParsed.setupScript ? {
      ...testParsed.setupScript,
      ...data.script.where({name: testParsed.setupScript.name}),
    } : undefined,
    assertions,
  };
}

/**
 * @param {object} data
 * @param {AriaATValidated.Test} data.test
 * @param {AriaATValidated.Command} data.command
 * @param {Queryable<AriaATCSV.Reference>} data.reference
 * @returns {AriaATFile.CollectedTest}
 */
function collectTestData({test, command, reference, key}) {
  return {
    info: {
      testId: test.testId,
      task: test.task,
      title: test.title,
      references: test.references,
    },
    target: {
      ...test.target,
      at: command.target.at,
      referencePage: reference.where({refId: 'reference'}).value,
      setupScript: test.setupScript,
    },
    instructions: {
      ...test.instructions,
      mode: MODE_INSTRUCTION_TEMPLATES[command.target.at.key][command.target.mode]({key}),
    },
    commands: command.commands,
    assertions: test.assertions,
  };
}

/**
 * @param {AriaATFile.CollectedTest} test
 */
function createCollectedTestFile(test, testPlanBuildDirectory) {
  return {
    path: path.join(testPlanBuildDirectory, `test-${test.info.testId.toString().padStart(2, '0')}-${test.info.task.replace(/\s+/g, '-')}-${test.target.mode}-${test.target.at.key}.collected.json`),
    content: beautify(test, null, 2, 40)
  };
}

/**
 * @param {AriaATFile.CollectedTest} test
 * @returns {string}
 */
function renderCollectedTestHtml(test, testFileName) {
  return reindent`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${test.info.title}</title>
    ${test.info.references.map(({value}) => `<link rel="help" href="${value}">`).join('\n')}
    <link rel="preload" href="${testFileName}" as="fetch">
    <style>
      table {
        border-collapse: collapse;
        margin-bottom: 1em;
      }

      table, td, th {
        border: 1px solid black;
      }

      td {
        padding: .5em;
      }

      table.record-results tr:first-child {
        font-weight: bold;
      }

      textarea {
        width: 100%
      }

      fieldset.problem-select {
        margin-top: 1em;
        margin-left: 1em;
      }

      .required:not(.highlight-required) {
        display: none;
      }

      .required-other:not(.highlight-required) {
        display: none;
      }

      .required.highlight-required {
        color: red;
      }

      fieldset.highlight-required {
        border-color: red;
      }

      fieldset .highlight-required {
        color: red;
      }

      .off-screen {
        position: absolute !important;
        height: 1px;
        width: 1px;
        overflow: hidden;
        clip: rect(1px, 1px, 1px, 1px);
        white-space: nowrap;
      }
    </style>
  </head>
  <body>
    <script type="module">
      import {loadCollectedTestAsync} from "../resources/aria-at-harness.mjs";
      loadCollectedTestAsync(new URL(location + "/..").pathname, "${testFileName}");
    </script>
  </body>
</html>
`;
}

/**
 * @param {AriaATFile.CollectedTest} test
 * @param {string} testPlanBuildDirectory
 * @returns {{path: string, content: string}}
 */
function createCollectedTestHtmlFile(test, testPlanBuildDirectory) {
  const testJsonFileName = `test-${test.info.testId.toString().padStart(2, '0')}-${test.info.task.replace(/\s+/g, '-')}-${test.target.mode}-${test.target.at.key}.collected.json`;
  return {
    path: path.join(testPlanBuildDirectory, `test-${test.info.testId.toString().padStart(2, '0')}-${test.info.task.replace(/\s+/g, '-')}-${test.target.mode}-${test.target.at.key}.collected.html`),
    content: renderCollectedTestHtml(test, testJsonFileName),
  };
}

exports.createExampleTests = createExampleTests
