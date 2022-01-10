/// <reference path="../types/aria-at-csv.js" />
/// <reference path="../types/aria-at-parsed.js" />
/// <reference path="../types/aria-at-validated.js" />
/// <reference path="../types/aria-at-file.js" />
/// <reference path="../lib/util/file-record-types.js" />

'use strict';

const path = require('path');
const fs = require('fs');
const { Readable } = require('stream');
const {
  types: { isArrayBufferView, isArrayBuffer },
} = require('util');

const csv = require('csv-parser');
const beautify = require('json-beautify');

const { validate } = require('../lib/util/error');
const { reindent } = require('../lib/util/lines');
const { Queryable } = require('../lib/util/queryable');
const { FileRecordChain } = require('../lib/util/file-record-chain');

const { parseSupport } = require('../lib/data/parse-support');
const { parseTestCSVRow } = require('../lib/data/parse-test-csv-row');
const { parseCommandCSVRow } = require('../lib/data/parse-command-csv-row');
const {
  createCommandTuplesATModeTaskLookup,
} = require('../lib/data/command-tuples-at-mode-task-lookup');

const {
  renderHTML: renderCollectedTestHtml,
} = require('../lib/data/templates/collected-test.html');
const { createExampleScriptsTemplate } = require('../lib/data/example-scripts-template');

/**
 * @param {string} directory - path to directory of data to be used to generate test
 * @param {object} args={}
 */
const createExampleTests = async ({ directory, args = {} }) => {
  let VERBOSE_CHECK = false;
  let VALIDATE_CHECK = false;

  let suppressedMessages = 0;

  /**
   * @param {string} message - message to be logged
   * @param {object} [options]
   * @param {boolean} [options.severe=false] - indicates whether the message should be viewed as an error or not
   * @param {boolean} [options.force=false] - indicates whether this message should be forced to be outputted regardless of verbosity level
   */
  const log = (message, { severe = false, force = false } = {}) => {
    if (VERBOSE_CHECK || force) {
      if (severe) console.error(message);
      else console.log(message);
    } else {
      // Output no logs
      suppressedMessages += 1; // counter to indicate how many messages were hidden
    }
  };

  /**
   * @param {string} message - error message
   */
  log.warning = message => log(message, { severe: true, force: true });

  /**
   * Log error then exit the process.
   * @param {string} message - error message
   */
  log.error = message => {
    log.warning(message);
    process.exit(1);
  };

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

  const supportFilePath = path.join(testsDirectory, 'support.json');
  const testsCsvFilePath = path.join(testPlanDirectory, 'data', 'tests.csv');
  const atCommandsCsvFilePath = path.join(testPlanDirectory, 'data', 'commands.csv');
  const referencesCsvFilePath = path.join(testPlanDirectory, 'data', 'references.csv');

  // build output folders and file paths setup
  const buildDirectory = path.join(rootDirectory, 'build');
  const testPlanBuildDirectory = path.join(buildDirectory, directory);
  const indexFileBuildOutputPath = path.join(testPlanBuildDirectory, 'index.html');

  // create build directory if it doesn't exist
  fs.existsSync(buildDirectory) || fs.mkdirSync(buildDirectory);

  const existingBuildPromise = FileRecordChain.read(buildDirectory, {
    glob: [
      '',
      'tests',
      `tests/${path.basename(directory)}`,
      `tests/${path.basename(directory)}/**`,
      'tests/resources',
      'tests/resources/*',
      'tests/support.json',
    ].join(','),
  });

  const [testPlanRecord, resourcesOriginalRecord, supportRecord] = await Promise.all(
    [testPlanDirectory, resourcesDirectory, supportFilePath].map(filepath =>
      FileRecordChain.read(filepath)
    )
  );

  const scriptsRecord = testPlanRecord.find('data/js');
  const resourcesRecord = resourcesOriginalRecord.filter({ glob: '{aria-at-*,keys,vrender}.mjs' });

  const newBuild = new FileRecordChain({
    entries: [
      {
        name: 'tests',
        entries: [
          {
            name: path.basename(directory),
            entries: testPlanRecord.filter({ glob: 'reference{,/**}' }).record.entries,
          },
          { name: 'resources', ...resourcesRecord.record },
          { name: 'support.json', ...supportRecord.record },
        ],
      },
    ],
  });

  const keyDefs = {};
  const support = JSON.parse(supportRecord.text);

  let allATKeys = support.ats.map(({ key }) => key);
  let allATNames = support.ats.map(({ name }) => name);

  const validAppliesTo = ['Screen Readers', 'Desktop Screen Readers'].concat(allATKeys);

  if (!testPlanRecord.isDirectory()) {
    log.error(`The test directory '${testPlanDirectory}' does not exist. Check the path to tests.`);
  }

  if (!testPlanRecord.find('data/tests.csv').isFile()) {
    log.error(`The tests.csv file does not exist. Please create '${testsCsvFilePath}' file.`);
  }

  if (!testPlanRecord.find('data/commands.csv').isFile()) {
    log.error(
      `The at-commands.csv file does not exist. Please create '${atCommandsCsvFilePath}' file.`
    );
  }

  if (!testPlanRecord.find('data/references.csv').isFile()) {
    log.error(
      `The references.csv file does not exist. Please create '${referencesCsvFilePath}' file.`
    );
  }

  // get Keys that are defined
  try {
    // read contents of the file
    const keys = resourcesRecord.find('keys.mjs').text;

    // split the contents by new line
    const lines = keys.split(/\r?\n/);

    // print all lines
    lines.forEach(line => {
      let parts1 = line.split(' ');
      let parts2 = line.split('"');

      if (parts1.length > 3) {
        let code = parts1[2].trim();
        keyDefs[code] = parts2[1].trim();
      }
    });
  } catch (err) {
    log.warning(err);
  }

  function cleanTask(task) {
    return task.replace(/'/g, '').replace(/;/g, '').trim().toLowerCase();
  }

  /**
   * Create Test File
   * @param {AriaATCSV.Test} test
   * @param refs
   * @param commands
   * @returns {(string|*[])[]}
   */
  function createTestFile(
    test,
    refs,
    commands,
    { addTestError, emitFile, scriptsRecord, exampleScriptedFilesQueryable }
  ) {
    let scripts = [];

    function getModeValue(value) {
      let v = value.trim().toLowerCase();
      if (!validModes.includes(v)) {
        addTestError(test.testId, '"' + value + '" is not valid value for "mode" property.');
      }
      return v;
    }

    function getTask(t) {
      let task = cleanTask(t);

      if (typeof commands[task] !== 'object') {
        addTestError(test.testId, '"' + task + '" does not exist in commands.csv file.');
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
          addTestError(test.testId, '"' + item + '" is not valid value for "appliesTo" property.');
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
        if (level !== '1' && level !== '2') {
          addTestError(
            test.testId,
            "Level value must be 1 or 2, value found was '" +
              level +
              "' for assertion '" +
              str +
              "' (NOTE: level 2 defined for this assertion)."
          );
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
            addTestError(test.testId, 'Reference does not exist: ' + item);
          }
        }
      });

      return links;
    }

    function addSetupScript(scriptName) {
      let script = '';
      if (scriptName) {
        if (!scriptsRecord.find(`${scriptName}.js`).isFile()) {
          addTestError(test.testId, `Setup script does not exist: ${scriptName}.js`);
          return '';
        }

        try {
          const data = scriptsRecord.find(`${scriptName}.js`).text;
          const lines = data.split(/\r?\n/);
          lines.forEach(line => {
            if (line.trim().length) script += '\t\t\t' + line.trim() + '\n';
          });
        } catch (err) {
          log.warning(err);
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
          addTestError(
            test.testId,
            'command is missing for the combination of task: "' +
              task +
              '", mode: "' +
              mode +
              '", and AT: "' +
              at.toLowerCase() +
              '" '
          );
        }
      }
    });

    let assertions = [];
    let id = test.testId;
    if (parseInt(test.testId) < 10) {
      id = '0' + id;
    }

    const cleanTaskName = cleanTask(test.task).replace(/\s+/g, '-');
    let testFileName = `test-${id}-${cleanTaskName}-${mode}.html`;
    let testJSONFileName = `test-${id}-${cleanTaskName}-${mode}.json`;

    let testPlanHtmlFileBuildPath = path.join(testPlanBuildDirectory, testFileName);
    let testPlanJsonFileBuildPath = path.join(testPlanBuildDirectory, testJSONFileName);

    let references = getReferences(refs.example, test.refs);
    addSetupScript(test.setupScript);

    for (let i = 1; i < 31; i++) {
      if (!test['assertion' + i]) {
        continue;
      }
      addAssertion(test['assertion' + i]);
    }

    /** @type {AriaATFile.Behavior} */
    let testData = {
      setup_script_description: getSetupScriptDescription(test.setupScriptDescription),
      setupTestPage: test.setupScript,
      applies_to: appliesTo,
      mode: mode,
      task: task,
      specific_user_instruction: test.instructions,
      output_assertions: assertions,
    };

    emitFile(testPlanJsonFileBuildPath, JSON.stringify(testData, null, 2), 'utf8');

    function getTestJson() {
      return JSON.stringify(testData, null, 2);
    }

    function getCommandsJson() {
      return beautify({ [task]: commands[task] }, null, 2, 40);
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
    displayTestPageAndInstructions("${
      exampleScriptedFilesQueryable.where({ name: test.setupScript ? test.setupScript : '' }).path
    }");
  });
</script>
  `;

    emitFile(testPlanHtmlFileBuildPath, testHTML, 'utf8');

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
  function createIndexFile(tasks, { emitFile }) {
    let rows = '';
    let all_ats = '';

    allATNames.forEach(at => (all_ats += '<th>' + at + '</th>\n'));

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
      rows += `<td>${task.script}</td></tr>\n`;
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
  <p>This is useful for viewing the local files on a local web server.</p>
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

    emitFile(indexFileBuildOutputPath, indexHTML, 'utf8');
  }

  // Process CSV files
  var refs = {};
  var errorCount = 0;
  var errors = '';
  var indexOfURLs = [];

  function addTestError(id, error) {
    errorCount += 1;
    errors += '[Test ' + id + ']: ' + error + '\n';
  }

  function addCommandError(task, key) {
    errorCount += 1;
    errors +=
      '[Command]: The key reference "' + key + '" is invalid for the "' + task + '" task.\n';
  }

  const newTestPlan = newBuild.find(`tests/${path.basename(testPlanBuildDirectory)}`);
  function emitFile(filepath, content) {
    newTestPlan.add(path.relative(testPlanBuildDirectory, filepath), {
      buffer: toBuffer(content),
    });
  }

  const [refRows, atCommands, tests] = await Promise.all([
    readCSV(testPlanRecord.find('data/references.csv')).then(rows => {
      log(`References CSV file successfully processed: ${referencesCsvFilePath}`);
      return rows;
    }),
    readCSV(testPlanRecord.find('data/commands.csv')).then(rows => {
      log(`Commands CSV file successfully processed: ${atCommandsCsvFilePath}`);
      return rows;
    }),
    readCSV(testPlanRecord.find('data/tests.csv')).then(rows => {
      log(`Test CSV file successfully processed: ${testsCsvFilePath}`);
      return rows;
    }),
  ]);

  for (const row of refRows) {
    refs[row.refId] = row.value.trim();
  }

  const scripts = loadScripts(scriptsRecord);

  const commandsParsed = atCommands.map(parseCommandCSVRow);
  const testsParsed = tests.map(parseTestCSVRow);
  const referencesParsed = parseRefencesCSV(refRows);
  const keysParsed = parseKeyMap(keyDefs);
  const supportParsed = parseSupport(support);

  const keysValidated = validateKeyMap(keysParsed, {
    addKeyMapError(reason) {
      errorCount += 1;
      errors += `[resources/keys.mjs]: ${reason}\n`;
    },
  });

  const supportQueryables = {
    at: Queryable.from('at', supportParsed.ats),
    atGroup: Queryable.from('atGroup', supportParsed.atGroups),
  };
  const keyQueryable = Queryable.from('key', keysValidated);
  const commandLookups = {
    key: keyQueryable,
    support: supportQueryables,
  };
  const commandsValidated = commandsParsed.map(command =>
    validateCommand(command, commandLookups, { addCommandError })
  );

  const referenceQueryable = Queryable.from('reference', referencesParsed);
  const examplePathOriginal = referenceQueryable.where({ refId: 'reference' }).value;
  const exampleRecord = testPlanRecord.find(examplePathOriginal);
  const testLookups = {
    command: Queryable.from('command', commandsValidated),
    mode: Queryable.from('mode', validModes),
    reference: referenceQueryable,
    script: Queryable.from('script', scripts),
    support: supportQueryables,
  };
  const testsValidated = testsParsed.map(test =>
    validateTest(test, testLookups, {
      addTestError: addTestError.bind(null, test.testId),
    })
  );

  /** @type {function(string): string} */
  const examplePathTemplate = scriptName =>
    path.join(
      path.dirname(examplePathOriginal),
      `${path.basename(examplePathOriginal, '.html')}${scriptName ? `.${scriptName}` : ''}.html`
    );
  const exampleTemplate = validate.reportTo(
    reason => log.warning(`[${examplePathOriginal}]: ${reason.message}`),
    () => createExampleScriptsTemplate(exampleRecord)
  );
  const exampleScriptedFiles = [{ name: '', source: '' }, ...scripts].map(({ name, source }) => ({
    name,
    path: examplePathTemplate(name),
    content: exampleTemplate.render(exampleTemplateParams(name, source)).toString(),
  }));
  const exampleScriptedFilesQueryable = Queryable.from('example', exampleScriptedFiles);

  const commandQueryable = Queryable.from('command', commandsValidated);
  const testsCollected = testsValidated.flatMap(test => {
    return test.target.at.map(({ key }) =>
      collectTestData({
        test,
        command: commandQueryable.where({
          testId: test.testId,
          target: { at: { key } },
        }),
        reference: referenceQueryable,
        example: exampleScriptedFilesQueryable,
        key: keyQueryable,
        modeInstructionTemplate: MODE_INSTRUCTION_TEMPLATES_QUERYABLE,
      })
    );
  });

  const files = [
    ...createScriptFiles(scripts, testPlanBuildDirectory),
    ...exampleScriptedFiles.map(({ path: pathSuffix, content }) => ({
      path: path.join('build', 'tests', path.basename(directory), pathSuffix),
      content,
    })),
    ...testsCollected.map(collectedTest =>
      createCollectedTestFile(collectedTest, testPlanBuildDirectory)
    ),
    ...testsCollected.map(collectedTest =>
      createCollectedTestHtmlFile(collectedTest, testPlanBuildDirectory)
    ),
  ];
  files.forEach(file => emitFile(file.path, file.content));

  const atCommandsMap = createCommandTuplesATModeTaskLookup(commandsValidated);
  emitFile(
    path.join(testPlanBuildDirectory, 'commands.json'),
    beautify(atCommandsMap, null, 2, 40)
  );

  log('Creating the following test files: ');
  tests.forEach(function (test) {
    try {
      const [url, applies_to_at] = createTestFile(test, refs, atCommandsMap, {
        addTestError,
        emitFile,
        scriptsRecord,
        exampleScriptedFilesQueryable,
      });

      indexOfURLs.push({
        id: test.testId,
        title: test.title,
        href: url,
        script: test.setupScript,
        applies_to_at: applies_to_at,
      });

      log('[Test ' + test.testId + ']: ' + url);
    } catch (err) {
      log.warning(err);
    }
  });

  createIndexFile(indexOfURLs, {
    emitFile,
  });

  const existingBuild = await existingBuildPromise;
  if (!existingBuild.isDirectory()) {
    log.error(`The destination 'build' directory does not exist.`);
  }

  const buildChanges = newBuild.changesAfter(existingBuild);

  if (!VALIDATE_CHECK) {
    await buildChanges.commit(buildDirectory);
  }

  if (errorCount) {
    log.warning(
      `*** ${errorCount} Errors in tests and/or commands in test plan [${directory}] ***`
    );
    log.warning(errors);
  } else {
    log('No validation errors detected\n');
  }

  return { isSuccessfulRun: errorCount === 0, suppressedMessages };
};

function toBuffer(content) {
  if (Buffer.isBuffer(content) || isArrayBufferView(content) || isArrayBuffer(content)) {
    return content;
  } else if (typeof content === 'string') {
    return Buffer.from(content);
  }
  return Buffer.from(content.toString());
}

function exampleTemplateParams(name, source) {
  return {
    script: reindent`
<!-- Generated by create-example-tests.js -->
<script>
  (function() {
    function setupScript(testPageDocument) {
      // ${name}
      ${source}
    };
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('button-run-test-setup')) {
        event.target.disabled = true;
        setupScript(document);
      }
    });
  })();
</script>
<!-- End of generated output -->`,
    button: reindent`
<!-- Generated by create-example-tests.js -->
<div style="position: relative; left: 0; right: 0; height: 2rem;">
  <button class="button-run-test-setup" autofocus style="height: 100%; width: 100%;"${
    source ? '' : ' disabled'
  }>Run Test Setup</button>
</div>
<!-- End of generated output -->`,
  };
}

/**
 * @param {FileRecord.Record} record
 * @returns {Promise<string[][]>}
 */
function readCSV(record) {
  const rows = [];
  return new Promise(resolve => {
    Readable.from(record.buffer)
      .pipe(csv())
      .on('data', row => {
        rows.push(row);
      })
      .on('end', () => {
        resolve(rows);
      });
  });
}

/**
 * @param {FileRecordChain} testPlanJS
 * @returns {AriaATParsed.ScriptSource[]}
 */
function loadScripts(testPlanJS) {
  return testPlanJS.filter({ glob: ',*.js' }).entries.map(({ name: fileName, text: source }) => {
    const name = path.basename(fileName, '.js');
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
 * @returns {{path: string, content: Uint8Array}[]}
 */
function createScriptFiles(scripts, testPlanBuildDirectory) {
  const jsonpFunction = 'scriptsJsonpLoaded';

  return [
    ...scripts.reduce((files, script) => {
      const { modulePath, jsonpPath } = script;
      const oneScript = [script];

      return [...files, ...renderFileVariants(oneScript, modulePath, jsonpPath)];
    }, []),
    ...renderFileVariants(scripts, 'scripts.module.js', 'scripts.jsonp.js'),
  ];

  function renderFileVariants(scripts, modulePath, jsonpPath) {
    return [
      {
        path: path.join(testPlanBuildDirectory, modulePath),
        content: encodeText(renderModule(scripts).toString()),
      },
      {
        path: path.join(testPlanBuildDirectory, jsonpPath),
        content: encodeText(renderJsonp(scripts).toString()),
      },
    ];
  }

  function renderJsonp(scripts) {
    return reindent`window[document.currentScript.getAttribute("jsonpFunction") || "${jsonpFunction}"]({
  ${scripts.map(renderJsonpExport).join(',\n')}
});
`;
  }

  function renderJsonpExport({ name, source }) {
    return reindent`${name}(testPageDocument) {
  ${source.trim()}
}`;
  }

  function renderModule(scripts) {
    return reindent`${scripts.map(renderModuleExport).join('\n\n')}
`;
  }

  function renderModuleExport({ name, source }) {
    return reindent`export function ${name}(testPageDocument) {
  ${source.trim()}
}`;
  }
}

/**
 * @param {Object<string, string>} keyLines
 * @returns {AriaATParsed.KeyMap}
 */
function parseKeyMap(keyDefs) {
  const keyMap = {};
  for (const id in keyDefs) {
    keyMap[id] = { id, keystroke: keyDefs[id] };
  }
  return keyMap;
}

/**
 * @param {AriaATCSV.Reference[]} referenceRows
 * @returns {AriaATParsed.ReferenceMap}
 */
function parseRefencesCSV(referenceRows) {
  const refMap = {};
  for (const { refId, value } of referenceRows) {
    refMap[refId] = { refId, value: value.trim() };
  }
  return refMap;
}

/**
 * @param {AriaATParsed.Command} commandParsed
 * @param {object} data
 * @param {Queryable<AriaATParsed.Key>} data.key
 * @param {object} data.support
 * @param {Queryable<{key: string, name: string}>} data.support.at
 * @param {object} [options]
 * @param {function(string, string): void} [options.addCommandError]
 * @returns {AriaATValidated.Command}
 */
function validateCommand(commandParsed, data, { addCommandError = () => {} } = {}) {
  return {
    ...commandParsed,
    target: {
      ...commandParsed.target,
      at: {
        ...commandParsed.target.at,
        ...mapDefined(data.support.at.where({ key: commandParsed.target.at.key }), ({ name }) => ({
          name,
        })),
      },
    },
    commands: commandParsed.commands.map(({ id, keypresses: commandKeypresses, ...rest }) => {
      const keypresses = commandKeypresses.map(keypress => {
        const key = data.key.where(keypress);
        if (!key) {
          addCommandError(commandParsed.task, keypress.id);
        }
        return key;
      });
      return {
        id: id,
        keystroke: keypresses.map(({ keystroke }) => keystroke).join(', then '),
        keypresses,
        ...rest,
      };
    }),
  };
}

/**
 * @param {AriaATParsed.KeyMap} keyMap
 */
function validateKeyMap(keyMap, { addKeyMapError }) {
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

const MODE_INSTRUCTION_TEMPLATES_QUERYABLE = Queryable.from('modeInstructionTemplate', [
  {
    at: 'jaws',
    mode: 'reading',
    render: data => {
      const altDelete = data.key.where({ id: 'ALT_DELETE' });
      const insZ = data.key.where({ id: 'INS_Z' });
      return `Verify the Virtual Cursor is active by pressing ${altDelete.keystroke}. If it is not, turn on the Virtual Cursor by pressing ${insZ.keystroke}.`;
    },
  },
  {
    at: 'jaws',
    mode: 'interaction',
    render: data => {
      const altDelete = data.key.where({ id: 'ALT_DELETE' });
      const insZ = data.key.where({ id: 'INS_Z' });
      return `Verify the PC Cursor is active by pressing ${altDelete.keystroke}. If it is not, turn off the Virtual Cursor by pressing ${insZ.keystroke}.`;
    },
  },
  {
    at: 'nvda',
    mode: 'reading',
    render: data => {
      const esc = data.key.where({ id: 'ESC' });
      return `Insure NVDA is in browse mode by pressing ${esc.keystroke}. Note: This command has no effect if NVDA is already in browse mode.`;
    },
  },
  {
    at: 'nvda',
    mode: 'interaction',
    render: data => {
      const insSpace = data.key.where({ id: 'INS_SPACE' });
      return `If NVDA did not make the focus mode sound when the test page loaded, press ${insSpace.keystroke} to turn focus mode on.`;
    },
  },
  {
    at: 'voiceover_macos',
    mode: 'reading',
    render: data => {
      const left = data.key.where({ id: 'LEFT' });
      const right = data.key.where({ id: 'RIGHT' });
      return `Toggle Quick Nav ON by pressing the ${left.keystroke} and ${right.keystroke} keys at the same time.`;
    },
  },
  {
    at: 'voiceover_macos',
    mode: 'interaction',
    render: data => {
      const left = data.key.where({ id: 'LEFT' });
      const right = data.key.where({ id: 'RIGHT' });
      return `Toggle Quick Nav OFF by pressing the ${left.keystroke} and ${right.keystroke} keys at the same time.`;
    },
  },
]);

/**
 * @param {T} maybeDefined
 * @param {function(T): U} goal
 * @returns {T}
 * @template T
 * @template {T} U
 */
function mapDefined(maybeDefined, goal) {
  if (maybeDefined) {
    return goal(maybeDefined);
  }
  return maybeDefined;
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
function validateTest(testParsed, data, { addTestError = () => {} } = {}) {
  if (!data.command.where({ task: testParsed.task })) {
    addTestError(`"${testParsed.task}" does not exist in commands.csv file.`);
  }

  testParsed.target.at.forEach(at => {
    if (!data.support.atGroup.where({ key: at.key })) {
      addTestError(`"${at.key}" is not valid value for "appliesTo" property.`);
    }

    if (
      !data.command.where({
        task: testParsed.task,
        target: {
          at: { key: at.key },
          mode: testParsed.target.mode,
        },
      })
    ) {
      addTestError(
        `command is missing for the combination of task: "${testParsed.task}", mode: "${testParsed.target.mode}", and AT: "${at.key}"`
      );
    }
  });

  if (!data.mode.where(testParsed.target.mode)) {
    addTestError(`"${testParsed.target.mode}" is not valid value for "mode" property.`);
  }

  const references = testParsed.references.filter(({ refId }) => {
    if (!data.reference.where({ refId })) {
      addTestError(`Reference does not exist: ${refId}`);
      return false;
    }
    return true;
  });

  if (testParsed.setupScript && !data.script.where({ name: testParsed.setupScript.name })) {
    addTestError(`Setup script does not exist: ${testParsed.setupScript.name}`);
  }

  const assertions = testParsed.assertions.map(assertion => {
    if (
      typeof assertion.priority === 'string' ||
      (assertion.priority !== 1 && assertion.priority !== 2)
    ) {
      addTestError(
        `Level value must be 1 or 2, value found was "${assertion.priority}" for assertion "${assertion.expectation}" (NOTE: level 2 defined for this assertion).`
      );
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
      ...[data.reference.where({ refId: 'example' })].filter(Boolean),
      ...references,
    ].map(ref => ({
      ...ref,
      ...data.reference.where({ refId: ref.refId }),
    })),
    target: {
      at: testParsed.target.at.map(at => ({
        ...at,
        ...mapDefined(data.support.at.where({ key: at.key }), ({ name }) => ({
          name,
        })),
      })),
      mode: testParsed.target.mode,
    },
    setupScript: testParsed.setupScript
      ? {
          ...testParsed.setupScript,
          ...data.script.where({ name: testParsed.setupScript.name }),
        }
      : undefined,
    assertions,
  };
}

/**
 * @param {object} data
 * @param {AriaATValidated.Test} data.test
 * @param {AriaATValidated.Command} data.command
 * @param {Queryable<AriaATParsed.Key>} data.key
 * @param {Queryable<{name: string, path: string}>} data.example
 * @param {Queryable<{at: string, mode: string, render: function({key: *}): string}>} data.modeInstructionTemplate
 * @returns {AriaATFile.CollectedTest}
 */
function collectTestData({ test, command, key, example, modeInstructionTemplate }) {
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
      referencePage: example.where({ name: test.setupScript ? test.setupScript.name : '' }).path,
      setupScript: test.setupScript,
    },
    instructions: {
      ...test.instructions,
      mode: modeInstructionTemplate
        .where({
          at: command.target.at.key,
          mode: command.target.mode,
        })
        .render({ key }),
    },
    commands: command.commands,
    assertions: test.assertions,
  };
}

function encodeText(text) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  return new Uint8Array(Buffer.from(text).arrayBuffer);
}

/**
 * @param {AriaATFile.CollectedTest} test
 */
function createCollectedTestFile(test, testPlanBuildDirectory) {
  return {
    path: path.join(
      testPlanBuildDirectory,
      `test-${test.info.testId.toString().padStart(2, '0')}-${test.info.task.replace(
        /\s+/g,
        '-'
      )}-${test.target.mode}-${test.target.at.key}.collected.json`
    ),
    content: encodeText(beautify(test, null, 2, 40)),
  };
}

/**
 * @param {AriaATFile.CollectedTest} test
 * @param {string} testPlanBuildDirectory
 * @returns {{path: string, content: Uint8Array}}
 */
function createCollectedTestHtmlFile(test, testPlanBuildDirectory) {
  const testJsonFileName = `test-${test.info.testId
    .toString()
    .padStart(2, '0')}-${test.info.task.replace(/\s+/g, '-')}-${test.target.mode}-${
    test.target.at.key
  }.collected.json`;
  return {
    path: path.join(
      testPlanBuildDirectory,
      `test-${test.info.testId.toString().padStart(2, '0')}-${test.info.task.replace(
        /\s+/g,
        '-'
      )}-${test.target.mode}-${test.target.at.key}.collected.html`
    ),
    content: encodeText(renderCollectedTestHtml(test, testJsonFileName)),
  };
}

exports.createExampleTests = createExampleTests;
