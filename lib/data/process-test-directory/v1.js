/// <reference path="../../../types/aria-at-csv.js" />
/// <reference path="../../../types/aria-at-parsed.js" />
/// <reference path="../../../types/aria-at-validated.js" />
/// <reference path="../../../types/aria-at-file.js" />
/// <reference path="../../util/file-record-types.js" />

'use strict';

const path = require('path');
const beautify = require('json-beautify');

const { validate } = require('../../util/error');
const { Queryable } = require('../../util/queryable');
const { FileRecordChain } = require('../../util/file-record-chain');

const { parseSupport } = require('../parse-support');
const { parseTestCSVRow } = require('../parse-test-csv-row');
const { parseCommandCSVRow } = require('../parse-command-csv-row');
const { createCommandTuplesATModeTaskLookup } = require('../command-tuples-at-mode-task-lookup');
const { createExampleScriptsTemplate } = require('../example-scripts-template');
const {
  Utils,
  createExampleScriptedFile,
  createScriptFiles,
  isScriptedReferenceRecord,
  loadScriptsSource,
  mapDefined,
  toBuffer,
} = require('./utils');

/**
 * @param {object} config
 * @param {string} config.directory - path to directory of data to be used to generate test
 * @param {string} config.testsDirectory - path to tests directory. Defaults to '<root>/tests'
 * @param {string} config.buildOutputDirectory - path to build directory. Defaults to '<root>/build'
 * @param {object} config.args
 */
const processTestDirectory = async config => {
  const directory = config?.directory;
  const args = config?.args || {};
  const TEST_MODE = !!args.testMode;

  // setup from arguments passed to npm script
  const utils = new Utils({
    testFormatVersion: 1,
    isVerbose: !!args.verbose,
    isValidate: !!args.validate,
  });

  const { log, VALIDATE_CHECK } = utils.logger;

  const validModes = ['reading', 'interaction', 'item'];

  /** Name of the test plan. */
  const testPlanName = path.basename(directory);

  // @param rootDirectory is dependent on this file not moving from the `lib/data` folder
  const cwd = path.dirname(__filename);
  const rootDirectory = path.join(cwd, '../../..');

  const testsDirectory = config?.testsDirectory ?? path.join(rootDirectory, 'tests');
  const testPlanDirectory = path.join(testsDirectory, testPlanName);

  const resourcesDirectory = path.join(rootDirectory, 'tests', 'resources');
  const supportFilePath = path.join(rootDirectory, 'tests', 'support.json');
  const atCommandsCsvFilePath = path.join(testPlanDirectory, 'data', 'commands.csv');
  const testsCsvFilePath = path.join(testPlanDirectory, 'data', 'testsV1.csv');
  const referencesCsvFilePath = path.join(testPlanDirectory, 'data', 'referencesV1.csv');

  // build output folders and file paths setup
  const buildDirectory = config?.buildOutputDirectory ?? path.join(rootDirectory, 'build');
  const buildTestsDirectory = path.join(buildDirectory, 'tests');
  const testPlanBuildDirectory = path.join(buildTestsDirectory, testPlanName);
  const indexFileBuildOutputPath = path.join(testPlanBuildDirectory, 'index.html');

  let backupTestsCsvFile, backupReferencesCsvFile;

  utils.testPlanDirectory = testPlanDirectory;

  const existingBuildPromise = FileRecordChain.read(buildDirectory, {
    glob: [
      '',
      'tests',
      `tests/${testPlanName}`,
      `tests/${testPlanName}/**`,
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

  utils.testPlanRecord = testPlanRecord;

  // Filter out reference html files with inline scripts. Files that are not
  // regenerated will be removed from the filesystem.
  const testPlanUpdate = await testPlanRecord.walk(record => {
    if (record.entries) {
      return {
        ...record,
        entries: record.entries.filter(record => !isScriptedReferenceRecord(record)),
      };
    }
    return record;
  });

  const newBuild = new FileRecordChain({
    entries: [
      {
        name: 'tests',
        entries: [
          {
            name: testPlanName,
            entries: testPlanUpdate.filter({ glob: 'reference{,/**}' }).record.entries,
          },
          { name: 'resources', ...resourcesRecord.record },
          { name: 'support.json', ...supportRecord.record },
        ],
      },
    ],
  });

  const keyDefs = {};
  const supportJson = JSON.parse(supportRecord.text);

  let allATKeys = supportJson.ats.map(({ key }) => key);
  let allATNames = supportJson.ats.map(({ name }) => name);

  const validAppliesTo = ['Screen Readers', 'Desktop Screen Readers'].concat(allATKeys);

  if (!testPlanRecord.isDirectory()) {
    log.error(`The test directory '${testPlanDirectory}' does not exist. Check the path to tests.`);
  }

  if (!testPlanRecord.find('data/commands.csv').isFile()) {
    log.error(
      `The at-commands.csv file does not exist. Please create '${atCommandsCsvFilePath}' file.`
    );
  }

  if (!testPlanRecord.find('data/testsV1.csv').isFile()) {
    // Check if original file can be processed
    if (!testPlanRecord.find('data/tests.csv').isFile()) {
      log.error(`The testsV1.csv file does not exist. Please create '${testsCsvFilePath}' file.`);
    } else {
      backupTestsCsvFile = 'data/tests.csv';
    }
  }

  if (!testPlanRecord.find('data/referencesV1.csv').isFile()) {
    // Check if original file can be processed
    if (!testPlanRecord.find('data/references.csv').isFile()) {
      log.error(
        `The referencesV1.csv file does not exist. Please create '${referencesCsvFilePath}' file.`
      );
    } else {
      backupReferencesCsvFile = 'data/references.csv';
    }
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

    // default setupScript if test has undefined setupScript
    if (!scriptsRecord.find(`${test.setupScript}.js`).isFile()) test.setupScript = '';

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
      testPlanStrings: supportJson.testPlanStrings,
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
    displayTestPageAndInstructions(${JSON.stringify(
      exampleScriptedFilesQueryable.where({ name: test.setupScript ? test.setupScript : '' }).path
    )});
  });
</script>
  `;

    emitFile(testPlanHtmlFileBuildPath, testHTML, 'utf8');

    const applies_to_at = [];

    allATKeys.forEach(at => applies_to_at.push(testData.applies_to.indexOf(at) >= 0));

    return [testFileName, applies_to_at];
  }

  /**
   * Create an index file for a local server
   * @param tasks
   * @param emitFile
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
  let refs = {};
  let errorCount = 0;
  let errors = '';
  let indexOfURLs = [];

  function addTestError(id, error) {
    errorCount += 1;
    errors += '[Test ' + id + ']: ' + error + '\n';
  }

  function addCommandError({ testId, task }, key) {
    errorCount += 1;
    errors += `[Command]: The key reference "${key}" found in "tests/${testPlanName}/data/commands.csv" for "test id ${testId}: ${task}" is invalid. Command may not be defined in "tests/resources/keys.mjs".\n`;
  }

  const newTestPlan = newBuild.find(`tests/${testPlanName}`);

  function emitFile(filepath, content) {
    newTestPlan.add(path.relative(testPlanBuildDirectory, filepath), {
      buffer: toBuffer(content),
    });
  }

  function generateSourceHtmlScriptFile(filePath, content) {
    testPlanUpdate.add(path.relative(testPlanDirectory, filePath), {
      buffer: toBuffer(content),
    });
  }

  function validateReferencesKeys(row) {
    if (typeof row.refId !== 'string' || typeof row.value !== 'string') {
      throw new Error('Row missing refId or value');
    }
    return row;
  }

  const validCommandKeys = /^(?:testId|task|mode|at|command[A-Z])$/;
  const numericKeyFormat = /^_(\d+)$/;
  function validateCommandsKeys(row) {
    // example header:
    //    testId,task,mode,at,commandA,commandB,commandC,commandD,commandE,commandF
    for (const key of Object.keys(row)) {
      if (numericKeyFormat.test(key)) {
        throw new Error(`Column found without header row, ${+key.substring(1) + 1}`);
      } else if (!validCommandKeys.test(key)) {
        throw new Error(`Unknown commands.csv key: ${key} - check header row?`);
      }
    }
    if (
      !(
        row.testId?.length &&
        row.task?.length &&
        row.mode?.length &&
        row.at?.length &&
        row.commandA?.length
      )
    ) {
      throw new Error('Missing one of required testId, task, mode, at, commandA');
    }
    return row;
  }

  const validTestsKeys =
    /^(?:testId|title|appliesTo|mode|task|setupScript|setupScriptDescription|refs|instructions|assertion(?:[1-9]|[1-2][0-9]|30))$/;
  function validateTestsKeys(row) {
    // example header:
    // testId,title,appliesTo,mode,task,setupScript,setupScriptDescription,refs,instructions,assertion1,assertion2,assertion3,assertion4,assertion5,assertion6,assertion7
    for (const key of Object.keys(row)) {
      if (numericKeyFormat.test(key)) {
        throw new Error(`Column found without header row, ${+key.substring(1) + 1}`);
      } else if (!validTestsKeys.test(key)) {
        throw new Error(`Unknown testsV1.csv key: ${key} - check header row?`);
      }
    }
    if (
      !(
        row.testId?.length &&
        row.title?.length &&
        row.appliesTo?.length &&
        row.mode?.length &&
        row.task?.length
      )
    ) {
      throw new Error('Missing one of required testId, title, appliesTo, mode, task');
    }
    return row;
  }

  const [atCommands, refRows, tests] = await Promise.all([
    utils.readCSVFile('data/commands.csv', validateCommandsKeys),
    utils.readCSVFile(backupReferencesCsvFile || 'data/referencesV1.csv', validateReferencesKeys),
    utils.readCSVFile(backupTestsCsvFile || 'data/testsV1.csv', validateTestsKeys),
  ]);

  for (const row of refRows) {
    refs[row.refId] = row.value.trim();
  }

  const scripts = loadScriptsSource(scriptsRecord);

  const commandsParsed = atCommands.map(parseCommandCSVRow);
  const testsParsed = tests.map(parseTestCSVRow);
  const referencesParsed = utils.parseReferencesCSV(refRows);
  const keysParsed = utils.parseKeyMap(keyDefs);
  const supportParsed = parseSupport(supportJson);

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
  const examplePathOriginal = referenceQueryable.where({ refId: 'reference' })
    ? referenceQueryable.where({ refId: 'reference' }).value
    : '';
  if (!examplePathOriginal) {
    log.error(
      `ERROR: Valid 'reference' value not found in "tests/${testPlanName}/data/referencesV1.csv".`
    );
  }
  const exampleRecord = testPlanRecord.find(examplePathOriginal);
  if (!exampleRecord.isFile()) {
    log.error(
      `ERROR: Invalid 'reference' value path "${examplePathOriginal}" found in "tests/${testPlanName}/data/referencesV1.csv".`
    );
  }
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

  const examplePathDirectory = path.dirname(examplePathOriginal);
  const examplePathBaseName = path.basename(examplePathOriginal, '.html');
  /** @type {function(string): string} */
  const examplePathTemplate = scriptName =>
    path.join(
      examplePathDirectory,
      `${examplePathBaseName}${scriptName ? `.${scriptName}` : ''}.html`
    );
  const exampleTemplate = validate.reportTo(
    reason => log.warning(`[${examplePathOriginal}]: ${reason.message}`),
    () => createExampleScriptsTemplate(exampleRecord)
  );
  const plainScriptedFile = createExampleScriptedFile('', examplePathTemplate, exampleTemplate, '');
  const scriptedFiles = scripts.map(({ name, source }) =>
    createExampleScriptedFile(name, examplePathTemplate, exampleTemplate, source)
  );
  const exampleScriptedFiles = [plainScriptedFile, ...scriptedFiles];
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
        modeInstructionTemplate: utils.MODE_INSTRUCTION_TEMPLATES_QUERYABLE(),
      })
    );
  });

  const buildFiles = [
    ...createScriptFiles(scripts, testPlanBuildDirectory),
    ...exampleScriptedFiles.map(({ path: pathSuffix, content }) => ({
      path: path.join(buildTestsDirectory, testPlanName, pathSuffix),
      content,
    })),
    ...testsCollected.map(collectedTest =>
      utils.createCollectedTestFile(collectedTest, testPlanBuildDirectory)
    ),
    ...testsCollected.map(collectedTest =>
      utils.createCollectedTestHtmlFile(collectedTest, testPlanBuildDirectory)
    ),
  ];
  buildFiles.forEach(file => {
    emitFile(file.path, file.content);
  });
  scriptedFiles.forEach(file => {
    generateSourceHtmlScriptFile(path.join(testsDirectory, testPlanName, file.path), file.content);
  });

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

  const prefixBuildPath = TEST_MODE ? '__test__/' : '';
  const prefixTestsPath = TEST_MODE ? '__test__/__mocks__/' : '';

  const existingRoot = new FileRecordChain({});
  existingRoot.add(`${prefixBuildPath}build`, await existingBuildPromise);
  existingRoot.add(`${prefixTestsPath}tests/${testPlanName}`, testPlanRecord);

  const newRoot = new FileRecordChain({});
  newRoot.add(`${prefixBuildPath}build`, newBuild);
  newRoot.add(`${prefixTestsPath}tests/${testPlanName}`, testPlanUpdate);

  const buildChanges = newRoot.changesAfter(existingRoot);

  if (!VALIDATE_CHECK) {
    await buildChanges.commit(rootDirectory);
  }

  if (errorCount) {
    log.warning(
      `*** ${errorCount} Errors in tests and/or commands in test plan [tests/${testPlanName}] ***`
    );
    log.warning(errors);
  } else {
    log('No validation errors detected\n');
  }

  return { isSuccessfulRun: errorCount === 0, suppressedMessages: log.suppressedMessages() };
};

exports.processTestDirectory = processTestDirectory;

/**
 * @param {AriaATParsed.Command} commandParsed
 * @param {object} data
 * @param {Queryable<AriaATParsed.Key>} data.key
 * @param {object} data.support
 * @param {Queryable<{key: string, name: string}>} data.support.at
 * @param {object} [options]
 * @param {function(AriaATParsed.Command, string): void} [options.addCommandError]
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
          addCommandError(commandParsed, keypress.id);
        }
        return key || {};
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
 * @param {function(string)} addKeyMapError
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
    addTestError(
      `Setup script does not exist: "${testParsed.setupScript.name}" for task "${testParsed.task}"`
    );
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
    setupScript:
      testParsed.setupScript && data.script.where({ name: testParsed.setupScript.name })
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
