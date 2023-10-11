/// <reference path="../../types/aria-at-csv.js" />
/// <reference path="../../types/aria-at-parsed.js" />
/// <reference path="../../types/aria-at-validated.js" />
/// <reference path="../../types/aria-at-file.js" />
/// <reference path="../util/file-record-types.js" />

'use strict';

const path = require('path');
const { Readable } = require('stream');
const {
  types: { isArrayBufferView, isArrayBuffer },
} = require('util');

const csv = require('csv-parser');
const fse = require('fs-extra');
const beautify = require('json-beautify');

const { validate } = require('../util/error');
const { reindent } = require('../util/lines');
const { Queryable } = require('../util/queryable');
const { FileRecordChain } = require('../util/file-record-chain');

const { parseSupport } = require('./parse-support');
const { parseTestCSVRowV2 } = require('./parse-test-csv-row');
const { parseCommandCSVRowV2, flattenObject } = require('./parse-command-csv-row');
const {
  createAtCommandTuplesATSettingsTestIdLookup,
} = require('./command-tuples-at-mode-task-lookup');

const { renderHTML: renderCollectedTestHtml } = require('./templates/collected-test.html');
const { createExampleScriptsTemplate } = require('./example-scripts-template');

/**
 * @param {string} directory - path to directory of data to be used to generate test
 * @param {object} args={}
 */
const processTestDirectory = async ({ directory, args = {} }) => {
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
  const VERBOSE_CHECK = !!args.verbose;
  const VALIDATE_CHECK = !!args.validate;

  // cwd; @param rootDirectory is dependent on this file not moving from the `lib/data` folder
  const libDataDirectory = path.dirname(__filename);
  const rootDirectory = path.join(libDataDirectory, '../..');

  const testsDirectory = path.join(rootDirectory, 'tests');
  const testPlanDirectory = path.join(rootDirectory, directory);

  const resourcesDirectory = path.join(testsDirectory, 'resources');
  const supportJsonFilePath = path.join(testsDirectory, 'support.json');
  const commandsJsonFilePath = path.join(testsDirectory, 'commands.json');
  const testsCsvFilePath = path.join(testPlanDirectory, 'data', 'tests.csv');
  const referencesCsvFilePath = path.join(testPlanDirectory, 'data', 'references.csv');
  const assertionsCsvFilePath = path.join(testPlanDirectory, 'data', 'assertions.csv');
  const scriptsCsvFilePath = path.join(testPlanDirectory, 'data', 'scripts.csv');

  // build output folders and file paths setup
  const buildDirectory = path.join(rootDirectory, 'build');
  const testPlanBuildDirectory = path.join(buildDirectory, directory);
  const indexFileBuildOutputPath = path.join(testPlanBuildDirectory, 'index.html');

  // create build directory if it doesn't exist
  fse.mkdirSync(buildDirectory, { recursive: true });

  const existingBuildPromise = FileRecordChain.read(buildDirectory, {
    glob: [
      '',
      'tests',
      `tests/${path.basename(directory)}`,
      `tests/${path.basename(directory)}/**`,
      'tests/resources',
      'tests/resources/*',
      'tests/support.json',
      'tests/commands.json',
    ].join(','),
  });

  const [testPlanRecord, resourcesOriginalRecord, supportJsonRecord, commandsJsonRecord] =
    await Promise.all(
      [testPlanDirectory, resourcesDirectory, supportJsonFilePath, commandsJsonFilePath].map(
        filepath => FileRecordChain.read(filepath)
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
          { name: 'support.json', ...supportJsonRecord.record },
          { name: 'commands.json', ...commandsJsonRecord.record },
        ],
      },
    ],
  });

  const supportJson = JSON.parse(supportJsonRecord.text);
  const commandsJson = JSON.parse(commandsJsonRecord.text);

  const allAts = supportJson.ats;
  const allAtKeys = allAts.map(({ key }) => key);
  const allAtNames = allAts.map(({ name }) => name);
  const atSettings = allAts
    .map(({ settings }) => settings)
    .flatMap(setting => Object.keys(setting));

  // Get paths to possible at keys
  const atCommandsCsvFilePaths = getTestPlanDataFilePaths(
    testPlanDirectory,
    allAtKeys.map(key => `${key}-commands.csv`)
  ).map((atCommandCsvFilePath, index) => ({ atKey: allAtKeys[index], atCommandCsvFilePath }));

  // readingMode and interactionMode are known screen reader 'at modes' found in
  // support.json at ats[].assertionTokens. The specific named modes are
  // stored in ats[].settings
  const validModes = ['readingMode', 'interactionMode', 'defaultMode'].concat(atSettings);

  if (!testPlanRecord.isDirectory()) {
    log.error(`The test directory '${testPlanDirectory}' does not exist. Check the path to tests.`);
  }

  if (!testPlanRecord.find('data/tests.csv').isFile()) {
    log.error(`The tests.csv file does not exist. Please create '${testsCsvFilePath}' file.`);
  }

  if (!testPlanRecord.find('data/references.csv').isFile()) {
    log.error(
      `The references.csv file does not exist. Please create '${referencesCsvFilePath}' file.`
    );
  }

  if (!testPlanRecord.find('data/assertions.csv').isFile()) {
    log.error(
      `The assertions.csv file does not exist. Please create '${assertionsCsvFilePath}' file.`
    );
  }

  if (!testPlanRecord.find('data/scripts.csv').isFile()) {
    log.error(`The scripts.csv file does not exist. Please create '${scriptsCsvFilePath}' file.`);
  }

  let someAtCommandsCsvExist = false;
  let missingAtCommandsCsvFiles = [];
  for (const atCommandCsvFilePath of atCommandsCsvFilePaths) {
    const { atKey, atCommandCsvFilePath: filePath } = atCommandCsvFilePath;

    // Checks that at least one {at}-commands.csv exists
    if (testPlanRecord.find(`data/${atKey}-commands.csv`).isFile()) someAtCommandsCsvExist = true;
    else missingAtCommandsCsvFiles.push(filePath);
  }
  if (!someAtCommandsCsvExist) {
    log.error(
      `No *-commands.csv files found. Please create at least one of the following: ${missingAtCommandsCsvFiles.join(
        ', '
      )}`
    );
  }

  /**
   * @param {AriaATCSV.Reference} row
   * @returns {AriaATCSV.Reference}
   */
  function validateReferencesKeys(row) {
    if (
      typeof row.refId !== 'string' ||
      typeof row.type !== 'string' ||
      typeof row.value !== 'string'
    ) {
      throw new Error('Row missing refId, type or value');
    }
    return row;
  }

  const validCommandKeys = /^(?:testId|command|settings|assertionExceptions|presentationNumber)$/;
  const numericKeyFormat = /^_(\d+)$/;
  const idFormat = /^[A-Za-z0-9-]+$/;
  const settingsFormat = /^[A-Za-z0-9-\s]+$/;
  function validateCommandsKeys(row) {
    // example header:
    // testId,command,settings,assertionExceptions,presentationNumber
    for (const key of Object.keys(row)) {
      if (numericKeyFormat.test(key)) {
        throw new Error(`Column found without header row, ${+key.substring(1) + 1}`);
      } else if (!validCommandKeys.test(key)) {
        throw new Error(`Unknown *-commands.csv key: ${key} - check header row?`);
      }
    }
    if (!(row.testId?.length && row.command?.length && row.presentationNumber?.length)) {
      throw new Error('Missing one of required testId, command, presentationNumber');
    }
    if (!idFormat.test(row.testId)) throw new Error('testId does not match the expected format');
    if (row.settings && !settingsFormat.test(row.settings))
      throw new Error('settings does not match the expected format');
    return row;
  }

  const validTestsKeys =
    /^(?:testId|title|presentationNumber|setupScript|instructions|assertions)$/;
  const titleFormat = /^[A-Z]([A-Za-z-',\s]){2,}[^.]$/;
  function validateTestsKeys(row) {
    // example header:
    // testId,title,presentationNumber,setupScript,instructions,assertions
    for (const key of Object.keys(row)) {
      if (numericKeyFormat.test(key)) {
        throw new Error(`Column found without header row, ${+key.substring(1) + 1}`);
      } else if (!validTestsKeys.test(key)) {
        throw new Error(`Unknown tests.csv key: ${key} - check header row?`);
      }
    }
    if (
      !(
        row.testId?.length &&
        row.title?.length &&
        row.presentationNumber?.length &&
        row.instructions?.length &&
        row.assertions?.length
      )
    ) {
      throw new Error(
        'Missing one of required testId, title, presentationNumber, instructions, assertions'
      );
    }
    if (!idFormat.test(row.testId)) throw new Error('testId does not match the expected format');
    if (!titleFormat.test(row.title)) throw new Error('title does not match the expected format');
    if (!Number(row.presentationNumber) > 0)
      throw new Error('presentationNumber does not match the expected format');
    return row;
  }

  const validAssertionsKeys =
    /^(?:assertionId|priority|assertionStatement|assertionPhrase|refIds)$/;
  const priorityFormat = /^[123]$/;
  const assertionStatementFormat = /^[A-Z]([A-Za-z'";$!,(){}.?|:\\/\-\s\d+]){2,}[A-Za-z']?$/;
  const assertionPhraseFormat = /^[a-z]([A-Za-z'";$!,(){}.?|:\\/\-\s\d+]){2,}[A-Za-z']?$/;
  function validateAssertionsKeys(row) {
    // example header:
    // assertionId,priority,assertionStatement,assertionPhrase,refIds
    for (const key of Object.keys(row)) {
      if (numericKeyFormat.test(key)) {
        throw new Error(`Column found without header row, ${+key.substring(1) + 1}`);
      } else if (!validAssertionsKeys.test(key)) {
        throw new Error(`Unknown tests.csv key: ${key} - check header row?`);
      }
    }
    if (
      !(
        row.assertionId?.length &&
        row.priority?.length &&
        row.assertionStatement?.length &&
        row.assertionPhrase?.length
      )
    ) {
      throw new Error(
        'Missing one of required assertionId, priority, assertionStatement, assertionPhrase'
      );
    }
    if (!idFormat.test(row.assertionId))
      throw new Error('assertionId does not match the expected format');
    if (!priorityFormat.test(row.priority))
      throw new Error('priority does not match the expected format');
    if (!assertionStatementFormat.test(row.assertionStatement))
      throw new Error('assertionStatement does not match the expected format');
    if (!assertionPhraseFormat.test(row.assertionPhrase))
      throw new Error('assertionPhrase does not match the expected format');
    return row;
  }

  const validScriptsKeys = /^(?:setupScript|setupScriptDescription)$/;
  const setupScriptDescriptionFormat = /^[a-z]([A-Za-z',(){}|\\/\-\s\d+]){2,}[A-Za-z']?$/;
  function validateScriptsKeys(row) {
    // example header:
    // setupScript,setupScriptDescription
    for (const key of Object.keys(row)) {
      if (numericKeyFormat.test(key)) {
        throw new Error(`Column found without header row, ${+key.substring(1) + 1}`);
      } else if (!validScriptsKeys.test(key)) {
        throw new Error(`Unknown tests.csv key: ${key} - check header row?`);
      }
    }
    if (!(row.setupScript?.length && row.setupScriptDescription?.length)) {
      throw new Error('Missing one of required setupScript, setupScriptDescription');
    }
    if (!setupScriptDescriptionFormat.test(row.setupScriptDescription))
      throw new Error('setupScriptDescription does not match the expected format');
    return row;
  }

  const [referencesCsv, testsCsv, assertionsCsv, scriptsCsv, ...atCommandsCsvs] = await Promise.all(
    [
      readCSVFile('data/references.csv', validateReferencesKeys),
      readCSVFile('data/tests.csv', validateTestsKeys),
      readCSVFile('data/assertions.csv', validateAssertionsKeys),
      readCSVFile('data/scripts.csv', validateScriptsKeys),
      ...atCommandsCsvFilePaths.map(({ atKey }) =>
        readCSVFile(`data/${atKey}-commands.csv`, validateCommandsKeys)
      ),
    ]
  );

  // Works because the order of allAtKeys and atCommandsCsvs should be maintained up this point
  const parsedAtCommandsCsvs = allAtKeys.map((atKey, index) => ({
    atKey,
    commands: atCommandsCsvs[index],
  }));

  const testsParsed = parseTestCSVRowV2({
    tests: testsCsv,
    assertions: assertionsCsv,
    scripts: scriptsCsv,
    commands: parsedAtCommandsCsvs,
  });

  /**
   *
   * @param {string} root
   * @param {string[]} fileNames
   * @return {array[string]}
   */
  function getTestPlanDataFilePaths(root, fileNames = []) {
    let filePaths = [];

    for (const fileName of fileNames) {
      const filePath = path.join(testPlanDirectory, 'data', fileName);
      filePaths.push(filePath);
    }

    return filePaths;
  }

  /**
   * Create Test File
   * @param {AriaATCSV.Test} test
   * @param {Object<string, Object<type, value, linkText>>} refs
   * @param {Object<string, Object<string, Object<string, [[string]]>>>} atCommandsMap
   * @param {object} options
   * @param {function(string, string)} options.addTestError
   * @param {function(filePath: string, content: any, encoding: string)} options.emitFile
   * @param {FileRecordChain} options.scriptsRecord
   * @param {Queryable<T>} options.exampleScriptedFilesQueryable
   * @returns {(string|*[])[]}
   */
  function createTestFile(
    test,
    refs,
    atCommandsMap,
    { addTestError, emitFile, scriptsRecord, exampleScriptedFilesQueryable }
  ) {
    let scripts = [];

    // default setupScript if test has undefined setupScript
    if (!scriptsRecord.find(`${test.setupScript?.script}.js`).isFile())
      test.setupScript = {
        ...test.setupScript,
        script: '',
      };

    function getTestId(testId) {
      if (typeof atCommandsMap[testId] !== 'object') {
        addTestError(test.testId, '"' + testId + '" does not exist in *-commands.csv file.');
      }
      return testId;
    }

    function getModeValue({ settings }) {
      let v = settings.trim();
      if (!validModes.includes(v)) {
        addTestError(test.testId, '"' + settings + '" is not valid value for "settings" property.');
      }
      return v;
    }

    function getReferences(test, refs) {
      let links = '';

      test.references.forEach(({ refId }) => {
        const { value: link, linkText } = refs[refId];

        if (typeof link === 'string' && link.length) {
          links += `<link rel="help" href="${link}" title="${linkText}">\n`;
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
      let js = 'let scripts = {\n';
      js += scripts.join(',\n');
      js += '\n\t};';
      return js;
    }

    let testId = getTestId(test.testId);
    let modes = test.target.ats.map(getModeValue).join('_');

    test.target.ats.forEach(at => {
      if (atCommandsMap[testId]) {
        if (!atCommandsMap[testId][at.settings][at.key]) {
          addTestError(
            testId,
            'command is missing for the combination of task: "' +
              testId +
              '", mode: "' +
              atCommandsMap[testId][at.settings] +
              '", and AT: "' +
              at.key.toLowerCase() +
              '" '
          );
        }
      }
    });

    // testId and test level presentationNumber should be enough of a descriptor to differentiate the values
    let testFileName = `test-review-${test.presentationNumber
      .toString()
      .padStart(2, '0')}-${testId}-${modes}`;

    let testPlanHtmlFileBuildPath = path.join(testPlanBuildDirectory, `${testFileName}.html`);
    let testPlanJsonFileBuildPath = path.join(testPlanBuildDirectory, `${testFileName}.json`);

    let exampleReferences = getReferences(test, refs);
    addSetupScript(test.setupScript.script);

    /** @type {AriaATFile.Behavior} */
    let testData = {
      task: testId,
      mode: modes,
      applies_to: test.target.ats.map(({ key }) => key),
      commandPresentationNumber: test.commandPresentationNumber,
      setup_script_description: getSetupScriptDescription(test.setupScript.scriptDescription),
      setupTestPage: test.setupScript.script,
      specific_user_instruction: test.instructions,
      commandsInfo: test.commandsInfo,
      output_assertions: test.assertions,
    };

    emitFile(testPlanJsonFileBuildPath, JSON.stringify(testData, null, 2), 'utf8');

    function getTestJson() {
      return JSON.stringify(testData, null, 2);
    }

    function getCommandsJson() {
      return beautify({ [testId]: atCommandsMap[testId] }, null, 2, 40);
    }

    let testHTML = `
<!DOCTYPE html>
<meta charset="utf-8">
<title>${test.title}</title>
${exampleReferences}
<script>
  ${getScripts()}
</script>
<script type="module">
  import { initialize, verifyATBehavior, displayTestPageAndInstructions } from "../resources/aria-at-harness.mjs";

  new Promise((resolve) => {
    fetch('../support.json')
      .then(response => resolve(response.json()))
    }).then(supportJson => {
      return fetch('../commands.json')
        .then(response => response.json())
        .then(allCommandsJson => ({ supportJson, allCommandsJson })
      );
    })
  .then(({ supportJson, allCommandsJson }) => {
    const testJson = ${getTestJson()};
    const commandJson = ${getCommandsJson()};
    initialize(supportJson, commandJson, allCommandsJson);
    verifyATBehavior(testJson);
    displayTestPageAndInstructions(${JSON.stringify(
      exampleScriptedFilesQueryable.where({ name: test.setupScript ? test.setupScript.script : '' })
        .path
    )});
  });
</script>
  `;

    emitFile(testPlanHtmlFileBuildPath, testHTML, 'utf8');

    const applies_to_at = [];
    allAtKeys.forEach(at => applies_to_at.push(testData.applies_to.indexOf(at) >= 0));

    return [testFileName, applies_to_at];
  }

  /**
   * Create an index file for a local server
   * @param {object[]} tasks
   * @param {number} tasks.seq
   * @param {string} tasks.id
   * @param {string} tasks.title
   * @param {string} tasks.href
   * @param {object} tasks.script
   * @param {string} tasks.script.script
   * @param {string} tasks.script.scriptDescription
   * @param {boolean[]} tasks.applies_to_at
   * @param {object} options
   * @param {function(filePath: string, content: any, encoding: string)} options.emitFile
   */
  function createIndexFile(tasks, { emitFile }) {
    let rows = '';
    let all_ats = '';

    allAtNames.forEach(at => (all_ats += '<th>' + at + '</th>\n'));

    tasks.forEach(function (task) {
      rows += `<tr><td>${task.seq}</td>`;
      rows += `<td>${task.id}</td>`;
      rows += `<td scope="row">${task.title}</td>`;
      for (let i = 0; i < allAtKeys.length; i++) {
        if (task.applies_to_at[i]) {
          rows += `<td class="test"><a href="${task.href}.html?at=${allAtKeys[i]}" aria-label="${allAtNames[i]} test for task ${task.id}">${allAtNames[i]}</a></td>`;
        } else {
          rows += `<td class="test none">not included</td>`;
        }
      }
      rows += `<td>${task.script.script}</td></tr>\n`;
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
      border-color: rgb(128,128,128);
    }

    thead {
      display: table-row-group;
      vertical-align: middle;
      border-bottom: black solid 2px;
    }

    tbody {
      display: table-row-group;
      vertical-align: middle;
      border-color: rgb(128,128,128);
    }

    tr:nth-child(even) {background: #DDD}
    tr:nth-child(odd) {background: #FFF}

    tr {
      display: table-row;
      vertical-align: inherit;
      border-color: rgb(128,128,128);
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
        <th>Sequence</th>
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
  let checkedSourceHtmlScriptFiles = [];

  /**
   * @param {string} id
   * @param {string} error
   */
  function addTestError(id, error) {
    errorCount += 1;
    errors += '[Test ' + id + ']: ' + error + '\n';
  }

  /**
   * @param {object} options
   * @param {string} options.testId
   * @param {object} options.target
   * @param {string} key
   */
  function addCommandError(
    {
      testId,
      target: {
        at: { key: atKey },
      },
    },
    key
  ) {
    errorCount += 1;
    errors += `[Command]: The key reference "${key}" found in "${directory}/data/${atKey}-commands.csv" for "test id ${testId}" is invalid. Command may not be defined in "tests/commands.json".\n`;
  }

  /**
   * @param {object} options
   * @param {string} options.testId
   * @param {object} options.target
   * @param {string} assertion
   */
  function addCommandAssertionExceptionError(
    {
      testId,
      target: {
        at: { key: atKey },
      },
    },
    assertion
  ) {
    errorCount += 1;
    errors += `[Command]: assertionExceptions reference "${assertion}" found in "${directory}/data/${atKey}-commands.csv" for "test id ${testId}" is invalid.\n`;
  }

  const newTestPlan = newBuild.find(`tests/${path.basename(testPlanBuildDirectory)}`);
  function emitFile(filepath, content) {
    newTestPlan.add(path.relative(testPlanBuildDirectory, filepath), {
      buffer: toBuffer(content),
    });
  }

  function generateSourceHtmlScriptFile(filePath, content) {
    // check that test plan's reference html file path is generated file
    if (
      filePath.includes('reference') &&
      (filePath.split(path.sep).pop().match(/\./g) || []).length > 1
    ) {
      // generate file at `<root>/tests/<directory>/reference/<path>/<directory>.<script>.html
      const sourceFilePath = filePath.replace(`build${path.sep}`, '');
      emitFile(sourceFilePath, content);
      checkedSourceHtmlScriptFiles.push(sourceFilePath);
    }
  }

  // intended to be an internal helper to reduce some code duplication and make logging for csv errors simpler
  async function readCSVFile(filePath, rowValidator = identity => identity) {
    let rawCSV = [];
    try {
      rawCSV = await readCSV(testPlanRecord.find(filePath));
    } catch (e) {
      log.warning(`WARNING: Error reading ${path.join(testPlanDirectory, filePath)}`);
      return rawCSV;
    }

    let index = 0;
    function printError(message) {
      // line number is index+2
      log.warning(
        `WARNING: Error parsing ${path.join(testPlanDirectory, filePath)} line ${
          index + 2
        }: ${message}`
      );
    }
    try {
      const firstRowKeysLength = Object.keys(rawCSV[0]).length;
      for (; index < rawCSV.length; index++) {
        const keysLength = Object.keys(rawCSV[index]).length;
        if (keysLength != firstRowKeysLength) {
          printError(
            `column number mismatch, please include empty cells to match headers. Expected ${firstRowKeysLength} columns, found ${keysLength}`
          );
        }
        if (!rowValidator(rawCSV[index])) {
          printError('validator returned false result');
          return;
        }
      }
    } catch (err) {
      printError(err);
      return;
    }
    log(`Successfully parsed ${path.join(testPlanDirectory, filePath)}`);
    return rawCSV;
  }

  for (const row of referencesCsv) {
    const {
      references: { aria, htmlAam },
    } = supportJson;

    let refId = row.refId.trim();
    let type = row.type.trim();
    let value = row.value.trim();
    let linkText = row.linkText.trim();

    if (type === 'aria') {
      value = `${aria.baseUrl}${aria.fragmentIds[value]}`;
      linkText = `${linkText} ${aria.linkText}`;
    }

    if (type === 'htmlAam') {
      value = `${htmlAam.baseUrl}${htmlAam.fragmentIds[value]}`;
      linkText = `${linkText} ${htmlAam.linkText}`;
    }

    refs[refId] = {
      type,
      value,
      linkText,
    };
  }

  const scriptsSource = loadScriptsSource(scriptsRecord);
  const commandsParsed = parseCommandCSVRowV2(
    {
      commands: parsedAtCommandsCsvs,
    },
    commandsJson
  );
  const {
    references: { aria, htmlAam },
  } = supportJson;
  const referencesParsed = parseReferencesCSV(referencesCsv, { aria, htmlAam });

  const keyDefs = flattenObject(commandsJson);
  const keysParsed = parseKeyMap(keyDefs);
  const supportParsed = parseSupport(supportJson);

  // TODO: This causes 'delete' to incorrectly not be recognized as a key, why?
  const keysValidated = validateKeyMap(keysParsed, {
    addKeyMapError(reason) {
      errorCount += 1;
      errors += `[commands.json]: ${reason}\n`;
    },
  });

  const supportQueryables = {
    ats: Queryable.from('ats', supportParsed.ats),
    atGroups: Queryable.from('atGroups', supportParsed.atGroups),
    references: Queryable.from('references', supportParsed.ats),
    testPlanStrings: Queryable.from('testPlanStrings', supportParsed.ats),
  };

  const keyQueryable = Queryable.from('key', keysValidated);
  const assertionQueryables = Queryable.from('assertions', assertionsCsv);
  const commandLookups = {
    key: keyQueryable,
    support: supportQueryables,
    assertions: assertionQueryables,
  };
  const commandsValidated = commandsParsed.map(command =>
    validateCommand(command, commandLookups, { addCommandError, addCommandAssertionExceptionError })
  );

  const referenceQueryable = Queryable.from('reference', referencesParsed);
  const examplePathOriginal = referenceQueryable.where({ refId: 'reference' })
    ? referenceQueryable.where({ refId: 'reference' }).value
    : '';
  if (!examplePathOriginal) {
    log.error(`ERROR: Valid 'reference' value not found in "${directory}/data/references.csv".`);
  }
  const exampleRecord = testPlanRecord.find(examplePathOriginal);
  if (!exampleRecord.isFile()) {
    log.error(
      `ERROR: Invalid 'reference' value path "${examplePathOriginal}" found in "${directory}/data/references.csv".`
    );
  }
  const testLookups = {
    command: Queryable.from('command', commandsValidated),
    mode: Queryable.from('mode', validModes),
    script: Queryable.from('script', scriptsSource),
    reference: referenceQueryable,
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
  const exampleScriptedFiles = [{ name: '', source: '' }, ...scriptsSource].map(
    ({ name, source }) => ({
      name,
      path: examplePathTemplate(name),
      content: exampleTemplate.render(exampleTemplateParams(name, source)).toString(),
    })
  );
  const exampleScriptedFilesQueryable = Queryable.from('example', exampleScriptedFiles);
  const commandQueryable = Queryable.from('command', commandsValidated);
  const testsCollected = testsValidated.flatMap(test => {
    return test.target.ats.map(({ key, settings }) =>
      collectTestData({
        test,
        command: commandQueryable.where({
          testId: test.testId,
          target: { at: { key, settings } },
        }),
        reference: referenceQueryable,
        example: exampleScriptedFilesQueryable,
        modeInstructionTemplate: MODE_INSTRUCTION_TEMPLATES_QUERYABLE(supportJson),
      })
    );
  });

  const files = [
    ...createScriptFiles(scriptsSource, testPlanBuildDirectory),
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
  files.forEach(file => {
    generateSourceHtmlScriptFile(file.path, file.content);
    return emitFile(file.path, file.content);
  });

  if (checkedSourceHtmlScriptFiles.length) {
    const sourceFolder = checkedSourceHtmlScriptFiles[0]
      .split(path.sep)
      .slice(0, -1)
      .join(path.sep);
    fse.readdirSync(sourceFolder).forEach(function (file) {
      const filePath = path.join(sourceFolder, file);
      // check that test plan's reference html file path is generated file
      if (file.includes('.html') && (file.split(path.sep).pop().match(/\./g) || []).length > 1) {
        // remove generated html files from source which include scripts which are no longer generated
        if (!checkedSourceHtmlScriptFiles.includes(filePath)) {
          fse.rmSync(path.join(sourceFolder, file));
        }
      }
    });
  }

  const atCommandsMap = createAtCommandTuplesATSettingsTestIdLookup(commandsValidated);

  emitFile(
    path.join(testPlanBuildDirectory, 'commands.json'),
    beautify(atCommandsMap, null, 2, 40)
  );

  log('Creating the following test files: ');
  testsParsed.forEach(function (testParsed) {
    try {
      const [url, applies_to_at] = createTestFile(testParsed, refs, atCommandsMap, {
        addTestError,
        emitFile,
        scriptsRecord,
        exampleScriptedFilesQueryable,
      });

      indexOfURLs.push({
        seq: testParsed.commandPresentationNumber,
        id: testParsed.testId,
        title: testParsed.title,
        href: url,
        script: testParsed.setupScript,
        applies_to_at: applies_to_at,
      });

      log('[Test ' + testParsed.testId + ']: ' + url);
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

exports.processTestDirectory = processTestDirectory;

/**
 * @param {FileRecord.Record} record
 * @returns {Promise<string[][]>}
 */
function readCSV(record) {
  const rows = [];
  return new Promise(resolve => {
    Readable.from(record.buffer)
      .pipe(
        csv({
          mapHeaders: ({ header, index }) => {
            if (header.toLowerCase().includes('\ufeff'))
              console.error(
                `Unwanted U+FEFF found for key ${header} at index ${index} while processing CSV.`
              );
            return header.replace(/^\uFEFF/g, '');
          },
          mapValues: ({ header, value }) => {
            if (value.toLowerCase().includes('\ufeff'))
              console.error(
                `Unwanted U+FEFF found for value in key, value pair (${header}: ${value}) while processing CSV.`
              );
            return value.replace(/^\uFEFF/g, '');
          },
        })
      )
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
function loadScriptsSource(testPlanJS) {
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
 * @param {Object<string, string>} keyDefs
 * @returns {AriaATParsed.KeyMap}
 */
function parseKeyMap(keyDefs) {
  const keyMap = {};
  for (const id in keyDefs) {
    if (id.includes('.')) {
      const [type, key] = id.split('.');
      keyMap[key] = { id: key, type, keystroke: keyDefs[id] };
    }
  }
  return keyMap;
}

/**
 * @param {AriaATCSV.Reference[]} referenceRows
 * @param {AriaATCSV.SupportReference} aria
 * @param {AriaATCSV.SupportReference} htmlAam
 * @returns {AriaATParsed.ReferenceMap}
 */
function parseReferencesCSV(referenceRows, { aria, htmlAam }) {
  const refMap = {};
  for (const { refId: _refId, type: _type, value: _value, linkText: _linkText } of referenceRows) {
    let refId = _refId?.trim();
    let type = _type?.trim();
    let value = _value?.trim();
    let linkText = _linkText?.trim();

    if (type === 'aria') {
      value = `${aria.baseUrl}${aria.fragmentIds[value]}`;
      linkText = `${linkText} ${aria.linkText}`;
    }

    if (type === 'htmlAam') {
      value = `${htmlAam.baseUrl}${htmlAam.fragmentIds[value]}`;
      linkText = `${linkText} ${htmlAam.linkText}`;
    }

    refMap[refId] = { refId, type, value, linkText };
  }
  return refMap;
}

/**
 * @param {AriaATParsed.Command} commandParsed
 * @param {object} data
 * @param {Queryable<AriaATParsed.Key>} data.key
 * @param {object} data.support
 * @param {Queryable<{key: string, name: string}>} data.support.at
 * @param {object} options
 * @param {function(AriaATParsed.Command, string): void} options.addCommandError
 * @param {function(AriaATParsed.Command, string): void} options.addCommandAssertionExceptionError
 * @returns {AriaATValidated.Command}
 */
function validateCommand(
  commandParsed,
  data,
  { addCommandError = () => {}, addCommandAssertionExceptionError = () => {} } = {}
) {
  return {
    ...commandParsed,
    target: {
      ...commandParsed.target,
      at: {
        ...commandParsed.target.at,
        ...mapDefined(data.support.ats.where({ key: commandParsed.target.at.key }), ({ name }) => ({
          name,
        })),
      },
    },
    commands: commandParsed.commands.map(({ id, keypresses, assertionExceptions, ...rest }) => {
      keypresses.forEach(keypress => {
        if (keypress.id.includes('+')) {
          const splitKeys = keypress.id.split('+');
          splitKeys.forEach(splitKey => {
            const key = data.key.where({ id: splitKey });
            if (!key) {
              addCommandError(commandParsed, keypress.id);
            }
          });
        } else {
          const key = data.key.where(keypress);
          if (!key) {
            addCommandError(commandParsed, keypress.id);
          }
        }
      });

      return {
        id,
        keypresses,
        assertionExceptions: assertionExceptions.map(each => {
          const [_priority, assertionId] = each.split(':');
          const priority = Number(_priority);

          if (isNaN(priority)) {
            addCommandAssertionExceptionError(commandParsed, each);
          } else {
            if (!/^[0123]$/.test(_priority)) {
              addCommandAssertionExceptionError(commandParsed, each);
            }
          }

          return { priority, assertionId };
        }),
        ...rest,
      };
    }),
  };
}

/**
 * @param {AriaATParsed.KeyMap} keyMap
 * @param {object} options
 * @param {function(string): void} options.addKeyMapError
 */
function validateKeyMap(keyMap, { addKeyMapError }) {
  if (!keyMap.alt) addKeyMapError('"alt" is not defined in keys module.');
  if (!keyMap.del) addKeyMapError('"del" is not defined in keys module.');
  if (!keyMap.ins) addKeyMapError('"ins" is not defined in keys module.');
  if (!keyMap.z) addKeyMapError('"z" is not defined in keys module.');
  if (!keyMap.esc) addKeyMapError('"esc" is not defined in keys module.');
  if (!keyMap.space) addKeyMapError('"space" is not defined in keys module.');
  if (!keyMap.left) addKeyMapError('"left" is not defined in keys module.');
  if (!keyMap.right) addKeyMapError('"right" is not defined in keys module.');

  return keyMap;
}

const MODE_INSTRUCTION_TEMPLATES_QUERYABLE = support => {
  const collection = [];
  support.ats.forEach(at => {
    const modes = Object.keys(at.settings);
    modes.forEach(mode => {
      collection.push({
        at: at.key,
        mode: mode,
        render: [at.defaultConfigurationInstructionsHTML, ...at.settings[mode].instructions],
      });
    });

    // Accounting for modeless AT configurations
    collection.push({
      at: at.key,
      mode: 'defaultMode',
      render: [at.defaultConfigurationInstructionsHTML],
    });
  });

  return Queryable.from('modeInstructionTemplate', collection);
};

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
 * @param {Queryable<{key: string, name: string}>} data.support.atGroups
 * @param {object} [options]
 * @param {function(string): void} [options.addTestError]
 * @returns {AriaATValidated.Test}
 */
function validateTest(testParsed, data, { addTestError = () => {} } = {}) {
  const assertionStatementTokenPattern = /\{([^{}]+)}/g;
  const replacedAssertionStatement = (assertionStatement, matches, replacements) => {
    matches.forEach(
      match =>
        (assertionStatement = assertionStatement.replaceAll(
          match,
          replacements[match.slice(1, -1)]
        ))
    );
    return assertionStatement;
  };

  if (!data.command.where({ testId: testParsed.testId })) {
    addTestError(`"${testParsed.testId}" does not exist in *-commands.csv file.`);
  }

  testParsed.target.ats.forEach(at => {
    if (!data.support.atGroups.where({ key: at.key })) {
      addTestError(`"${at.key}" is not valid value for "appliesTo" property.`);
    }

    if (
      !data.command.where({
        target: {
          at: { key: at.key, settings: at.settings },
        },
      })
    ) {
      addTestError(
        `command is missing for the combination of task: "${testParsed.testId}", mode: "${at.settings}", and AT: "${at.key}"`
      );
    }
  });

  testParsed.target.ats.forEach(at => {
    if (!data.mode.where(at.settings)) {
      addTestError(`"${at.settings}" is not valid value for "settings" property.`);
    }
  });

  const references = testParsed.references.filter(({ refId }) => {
    if (!data.reference.where({ refId })) {
      addTestError(`Reference does not exist: ${refId}`);
      return false;
    }
    return true;
  });

  if (testParsed.setupScript && !data.script.where({ name: testParsed.setupScript.script })) {
    addTestError(
      `Setup script does not exist: "${testParsed.setupScript.script}" for task "${testParsed.testId}"`
    );
  }

  const assertions = testParsed.assertions.map(assertion => {
    assertion.tokenizedAssertionStatements = {};

    // There are assertion tokens to account for
    if (assertion.assertionStatement.includes('|')) {
      const [genericAssertionStatement, tokenizedAssertionStatement] =
        assertion.assertionStatement.split('|');

      // Set fallback just in case tokenized statement or properties do not exist
      assertion.assertionStatement = genericAssertionStatement;

      if (tokenizedAssertionStatement) {
        const matches = tokenizedAssertionStatement.match(assertionStatementTokenPattern);

        testParsed.target.ats.forEach(at => {
          const { assertionTokens } = data.support.ats.where({ key: at.key });
          const tokensExist =
            assertionTokens && matches.every(match => assertionTokens[match.slice(1, -1)]);

          if (tokensExist) {
            assertion.tokenizedAssertionStatements[at.key] = replacedAssertionStatement(
              tokenizedAssertionStatement,
              matches,
              assertionTokens
            );
          }
        });
      }
    }

    if (
      typeof assertion.priority === 'string' ||
      (assertion.priority !== 1 && assertion.priority !== 2 && assertion.priority !== 3)
    ) {
      addTestError(
        `Level value must be 1, 2 or 3, value found was "${assertion.priority}" for assertion "${assertion.assertionStatement}" (NOTE: Priority 3 defined for this assertion).`
      );
      return {
        ...assertion,
        priority: 3,
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
      ats: testParsed.target.ats.map(at => ({
        ...at,
        ...mapDefined(data.support.ats.where({ key: at.key }), ({ name }) => ({
          name,
        })),
      })),
    },
    setupScript:
      testParsed.setupScript && data.script.where({ name: testParsed.setupScript.script })
        ? {
            ...testParsed.setupScript,
            ...data.script.where({ name: testParsed.setupScript.script }),
          }
        : undefined,
    assertions,
  };
}

/**
 * @param {object} data
 * @param {AriaATValidated.Test} data.test
 * @param {AriaATValidated.Command} data.command
 * @param {Queryable<{name: string, path: string}>} data.example
 * @param {Queryable<{at: string, mode: string, render: function({key: *}): string}>} data.modeInstructionTemplate
 * @returns {AriaATFile.CollectedTest}
 */
function collectTestData({ test, command, example, modeInstructionTemplate }) {
  return {
    info: {
      testId: test.testId,
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
      instructions: test.instructions,
      mode: modeInstructionTemplate.where({
        at: command.target.at.key,
        mode: command.target.at.settings,
      }).render,
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
 * @param {string} testPlanBuildDirectory
 * @returns {{path: string, content: Uint8Array}}
 */
function createCollectedTestFile(test, testPlanBuildDirectory) {
  const commandPresentationNumber = parseInt(test.commands[0].presentationNumber)
    .toString()
    .padStart(2, '0');

  return {
    path: path.join(
      testPlanBuildDirectory,
      `test-${commandPresentationNumber}-${test.info.testId}-${test.target.at.settings}-${test.target.at.key}.collected.json`
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
  const commandPresentationNumber = parseInt(test.commands[0].presentationNumber)
    .toString()
    .padStart(2, '0');
  const testFileName = `test-${commandPresentationNumber}-${test.info.testId}-${test.target.at.settings}-${test.target.at.key}`;

  return {
    path: path.join(testPlanBuildDirectory, `${testFileName}.collected.html`),
    content: encodeText(renderCollectedTestHtml(test, `${testFileName}.collected.json`)),
  };
}

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
<!-- Generated by process-test-directory.js -->
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
<!-- Generated by process-test-directory.js -->
<div style="position: relative; left: 0; right: 0; height: 2rem;">
  <button class="button-run-test-setup" autofocus style="height: 100%; width: 100%;"${
    source ? '' : ' disabled'
  }>Run Test Setup</button>
</div>
<!-- End of generated output -->`,
  };
}
