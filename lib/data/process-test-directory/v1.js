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
  getSetupScriptDescription,
  loadScriptsSource,
  mapDefined,
  toBuffer,
  detectSubfolderStructure,
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

  // setup from arguments passed to npm script or test runner
  const utils = new Utils({
    testFormatVersion: 1,
    isVerbose: !!args.verbose,
    isValidate: !!args.validate,
  });

  const { log, VALIDATE_CHECK } = utils.logger;

  /** Name of the test plan. */
  const testPlanName = path.basename(directory);

  // @param rootDirectory is dependent on this file not moving from the `lib/data` folder
  const cwd = path.dirname(__filename);
  const rootDirectory = path.join(cwd, '../../..');

  let testsDirectory = config?.testsDirectory ?? path.join(rootDirectory, 'tests');

  // Detect subfolder structure dynamically
  const { subfolder, subfolderName } = detectSubfolderStructure(testsDirectory, testPlanName);
  const testPlanDirectory = subfolder
    ? path.join(testsDirectory, subfolder, testPlanName)
    : path.join(testsDirectory, testPlanName);
  // Remap top-level tests directory from aria-at/tests to aria-at/tests/apg, aria-at/tests/openui, etc
  if (subfolder) testsDirectory = path.join(testsDirectory, subfolder);

  const resourcesDirectory = path.join(rootDirectory, 'resources');
  const supportJsonFilePath = path.join(rootDirectory, 'tests', 'support.json');
  const atCommandsCsvFilePath = path.join(testPlanDirectory, 'data', 'commands.csv');
  const testsCsvFilePath = path.join(testPlanDirectory, 'data', 'testsV1.csv');
  const referencesCsvFilePath = path.join(testPlanDirectory, 'data', 'referencesV1.csv');

  // build output folders and file paths setup
  const buildDirectory = config?.buildOutputDirectory ?? path.join(rootDirectory, 'build');
  const buildTestsDirectory = path.join(buildDirectory, 'tests');
  const testPlanBuildDirectory = subfolder
    ? path.join(buildTestsDirectory, subfolder, testPlanName)
    : path.join(buildTestsDirectory, testPlanName);
  const indexFileBuildOutputPath = path.join(testPlanBuildDirectory, 'index.html');

  utils.testPlanName = testPlanName;
  utils.testPlanDirectory = testPlanDirectory;

  const testPlanGlobPath = subfolder
    ? `tests/${subfolder}/${testPlanName}`
    : `tests/${testPlanName}`;
  const existingBuildPromise = FileRecordChain.read(buildDirectory, {
    glob: [
      '',
      'tests',
      testPlanGlobPath,
      `${testPlanGlobPath}/**`,
      'tests/support.json',
      'resources',
      'resources/*',
    ].join(','),
  });

  const [testPlanRecord, resourcesOriginalRecord, supportJsonRecord] = await Promise.all(
    [testPlanDirectory, resourcesDirectory, supportJsonFilePath].map(filepath =>
      FileRecordChain.read(filepath)
    )
  );
  const scriptsRecord = testPlanRecord.find('data/js');
  const resourcesRecord = resourcesOriginalRecord.filter({ glob: '{aria-at-*,keys,vrender}.mjs' });

  utils.testPlanRecord = testPlanRecord;
  utils.resourcesRecord = resourcesRecord;
  utils.scriptsRecord = scriptsRecord;
  utils.supportJsonRecord = supportJsonRecord;

  // Filter out reference html files with inline scripts. Files that are not
  // regenerated will be removed from the filesystem.
  const testPlanUpdate = await utils.getTestPlanUpdateRecord();
  const newBuild = utils.getNewBuild(testPlanUpdate);

  const supportJson = JSON.parse(supportJsonRecord.text);

  const allAtKeys = supportJson.ats.map(({ key }) => key);
  const allAtNames = supportJson.ats.map(({ name }) => name);

  const validModes = ['reading', 'interaction', 'item'];
  const validAppliesTo = ['Screen Readers', 'Desktop Screen Readers'].concat(allAtKeys);

  utils.checkForMissingPath(testPlanRecord, 'directory', { path: testPlanDirectory });
  utils.checkForMissingPath(testPlanRecord, 'file', {
    path: atCommandsCsvFilePath,
    fileName: 'commands.csv',
    shortenedFilePath: 'data/commands.csv',
  });

  // To handle in the case where a v1 test plan hasn't yet been updated
  let backupTestsCsvFile, backupReferencesCsvFile;
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

  // Common regex patterns found in *.csvs
  const numericKeyFormat = /^_(\d+)$/;

  const validReferenceKeys = /^(?:refId|value)$/;
  function validateReferencesKeys(row) {
    for (const key of Object.keys(row)) {
      if (numericKeyFormat.test(key)) {
        throw new Error(`Column found without header row, ${+key.substring(1) + 1}`);
      } else if (!validReferenceKeys.test(key)) {
        throw new Error(`Unknown references.csv key: ${key} - check header row?`);
      }
    }
    if (typeof row.refId !== 'string' || typeof row.value !== 'string') {
      throw new Error('Row missing refId or value');
    }
    return row;
  }

  const validCommandKeys = /^(?:testId|task|mode|at|command[A-Z])$/;
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

  const [testsCsv, atCommandsCsv, referencesCsv] = await Promise.all([
    utils.readCSVFile(backupTestsCsvFile || 'data/testsV1.csv', validateTestsKeys),
    utils.readCSVFile('data/commands.csv', validateCommandsKeys),
    utils.readCSVFile(backupReferencesCsvFile || 'data/referencesV1.csv', validateReferencesKeys),
  ]);

  function cleanTask(task) {
    return task.replace(/'/g, '').replace(/;/g, '').trim().toLowerCase();
  }

  /**
   * Create Test File
   * @param {AriaATCSV.Test} test
   * @param refs
   * @param commands
   * @param {object} options
   * @param {function(filePath: string, content: any, encoding: string)} options.emitFile
   * @param {FileRecordChain} options.scriptsRecord
   * @param {Queryable<T>} options.exampleScriptedFilesQueryable
   * @returns {(string|*[])[]}
   */
  function createTestFile(
    test,
    refs,
    commands,
    { emitFile, scriptsRecord, exampleScriptedFilesQueryable }
  ) {
    // default setupScript if test has undefined setupScript
    if (!scriptsRecord.find(`${test.setupScript}.js`).isFile()) test.setupScript = '';

    function getTask(t) {
      let task = cleanTask(t);
      if (typeof commands[task] !== 'object') {
        utils.addTestError(test.testId, '"' + task + '" does not exist in commands.csv file.');
      }
      return task;
    }

    function getModeValue(value) {
      let v = value.trim().toLowerCase();
      if (!validModes.includes(v)) {
        utils.addTestError(test.testId, '"' + value + '" is not valid value for "mode" property.');
      }
      return v;
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
          utils.addTestError(
            test.testId,
            '"' + item + '" is not valid value for "appliesTo" property.'
          );
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
          utils.addTestError(
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

    function getExampleReferences() {
      const example = refs.example;
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
            utils.addTestError(test.testId, 'Reference does not exist: ' + item);
          }
        }
      });

      return links;
    }

    // Prepare file name descriptors
    let task = getTask(test.task);
    let mode = getModeValue(test.mode);
    let appliesTo = getAppliesToValues(test.appliesTo);

    appliesTo.forEach(at => {
      if (commands[task]) {
        if (!commands[task][mode][at.toLowerCase()]) {
          utils.addTestError(
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

    let id = test.testId;
    if (parseInt(test.testId) < 10) {
      id = '0' + id;
    }

    // Define file names
    const cleanTaskName = cleanTask(test.task).replace(/\s+/g, '-');
    const testFileName = `test-${id}-${cleanTaskName}-${mode}.html`;
    const testJSONFileName = `test-${id}-${cleanTaskName}-${mode}.json`;

    const testPlanHtmlFileBuildPath = path.join(testPlanBuildDirectory, testFileName);
    const testPlanJsonFileBuildPath = path.join(testPlanBuildDirectory, testJSONFileName);

    const exampleReferences = getExampleReferences();
    const scriptsContent = [...utils.addSetupScript(test.testId, test.setupScript)];

    let assertions = [];
    for (let i = 1; i < 31; i++) {
      if (!test['assertion' + i]) {
        continue;
      }
      addAssertion(test['assertion' + i]);
    }

    /** @type {AriaATFile.Behavior} */
    let testData = {
      task: task,
      mode: mode,
      applies_to: appliesTo,
      setup_script_description: getSetupScriptDescription(test.setupScriptDescription),
      specific_user_instruction: test.instructions,
      setupTestPage: test.setupScript,
      testPlanStrings: supportJson.testPlanStrings,
      output_assertions: assertions,
    };

    const testHtml = utils.getTestHtml({
      title: test.title,
      testJson: JSON.stringify(testData, null, 2),
      scriptsJs: utils.getScriptsJs(scriptsContent),
      commandsJson: beautify({ [task]: commands[task] }, null, 2, 40),
      exampleReferences,
      testPageAndInstructionsPath: JSON.stringify(
        exampleScriptedFilesQueryable.where({ name: test.setupScript ? test.setupScript : '' }).path
      ),
    });

    emitFile(testPlanJsonFileBuildPath, JSON.stringify(testData, null, 2), 'utf8');
    emitFile(testPlanHtmlFileBuildPath, testHtml, 'utf8');

    const applies_to_at = [];
    allAtKeys.forEach(at => applies_to_at.push(testData.applies_to.indexOf(at) >= 0));

    return [testFileName, applies_to_at];
  }

  /**
   * Create an index file for a local server
   * @param tasks
   * @param emitFile
   */
  function createIndexFile(tasks, { emitFile }) {
    let rows = '';
    let atHeaders = '';

    allAtNames.forEach(at => (atHeaders += '<th>' + at + '</th>\n'));
    tasks.forEach(function (task) {
      rows += `<tr><td>${task.id}</td>`;
      rows += `<td scope="row">${task.title}</td>`;
      for (let i = 0; i < allAtKeys.length; i++) {
        if (task.applies_to_at[i]) {
          rows += `<td class="test"><a href="${task.href}?at=${allAtKeys[i]}" aria-label="${allAtNames[i]} test for task ${task.id}">${allAtNames[i]}</a></td>`;
        } else {
          rows += `<td class="test none">not included</td>`;
        }
      }
      rows += `<td>${task.script}</td></tr>\n`;
    });

    const indexHtml = utils.getIndexHtml({ atHeaders, rows });

    emitFile(indexFileBuildOutputPath, indexHtml, 'utf8');
  }

  // Process CSV files
  const refs = utils.getRefs(referencesCsv);
  const indexOfURLs = [];
  const newTestPlan = newBuild.find(`tests/${path.basename(testPlanBuildDirectory)}`);

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

  const testsParsed = testsCsv.map(parseTestCSVRow);
  const scriptsSource = loadScriptsSource(scriptsRecord);
  const commandsParsed = atCommandsCsv.map(parseCommandCSVRow);
  const referencesParsed = utils.parseReferencesCSV(referencesCsv);

  const keyDefs = utils.getKeyDefs();
  const keysParsed = utils.parseKeyMap(keyDefs);
  const supportParsed = parseSupport(supportJson);

  const keysValidated = utils.validateKeyMap(keysParsed, {
    addKeyMapError: utils.addKeyMapError,
  });

  // Retrieve queryables
  const supportQueryables = {
    at: Queryable.from('at', supportParsed.ats),
    atGroup: Queryable.from('atGroup', supportParsed.atGroups),
  };
  const keyQueryable = Queryable.from('key', keysValidated);
  const referenceQueryable = Queryable.from('reference', referencesParsed);

  const commandLookups = {
    key: keyQueryable,
    support: supportQueryables,
  };
  const commandsValidated = commandsParsed.map(command =>
    validateCommand(command, commandLookups, { addCommandError: utils.addCommandError })
  );

  const testLookups = {
    command: Queryable.from('command', commandsValidated),
    mode: Queryable.from('mode', validModes),
    script: Queryable.from('script', scriptsSource),
    reference: referenceQueryable,
    support: supportQueryables,
  };
  const testsValidated = testsParsed.map(test =>
    validateTest(test, testLookups, {
      addTestError: utils.addTestError.bind(null, test.testId),
    })
  );

  const examplePathOriginal = referenceQueryable.where({ refId: 'reference' })
    ? referenceQueryable.where({ refId: 'reference' }).value
    : '';
  if (!examplePathOriginal) {
    const testPlanPath = subfolder ? `tests/${subfolder}/${testPlanName}` : `tests/${testPlanName}`;
    log.error(
      `ERROR: Valid 'reference' value not found in "${testPlanPath}/${
        backupReferencesCsvFile || 'data/referencesV1.csv'
      }".`
    );
  }
  const exampleRecord = testPlanRecord.find(examplePathOriginal);
  if (!exampleRecord.isFile()) {
    const testPlanPath = subfolder ? `tests/${subfolder}/${testPlanName}` : `tests/${testPlanName}`;
    log.error(
      `ERROR: Invalid 'reference' value path "${examplePathOriginal}" found in "${testPlanPath}/${
        backupReferencesCsvFile || 'data/referencesV1.csv'
      }".`
    );
  }
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
  const scriptedFiles = scriptsSource.map(({ name, source }) =>
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
    ...createScriptFiles(scriptsSource, testPlanBuildDirectory),
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
  buildFiles.forEach(file => emitFile(file.path, file.content));
  scriptedFiles.forEach(file =>
    generateSourceHtmlScriptFile(path.join(testsDirectory, testPlanName, file.path), file.content)
  );

  const atCommandsMap = createCommandTuplesATModeTaskLookup(commandsValidated);

  emitFile(
    path.join(testPlanBuildDirectory, 'commands.json'),
    beautify(atCommandsMap, null, 2, 40)
  );

  log('Creating the following test files: ');
  testsCsv.forEach(function (test) {
    try {
      const [url, applies_to_at] = createTestFile(test, refs, atCommandsMap, {
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
  existingRoot.add(`${prefixTestsPath}${testPlanGlobPath}`, testPlanRecord);

  const newRoot = new FileRecordChain({});
  newRoot.add(`${prefixBuildPath}build`, newBuild);
  newRoot.add(`${prefixTestsPath}${testPlanGlobPath}`, testPlanUpdate);

  const buildChanges = newRoot.changesAfter(existingRoot);

  if (!VALIDATE_CHECK) {
    await buildChanges.commit(rootDirectory);
  }

  if (utils.errorCount) {
    const testPlanPath = subfolder ? `tests/${subfolder}/${testPlanName}` : `tests/${testPlanName}`;
    log.warning(
      `*** ${utils.errorCount} Errors in tests and/or commands in test plan [${testPlanPath}] ***`
    );
    log.warning(utils.errors);
  } else {
    const testPlanPath = subfolder ? `tests/${subfolder}/${testPlanName}` : `tests/${testPlanName}`;
    log(`No validation errors detected for ${testPlanPath}\n`);
  }

  return { isSuccessfulRun: utils.errorCount === 0, suppressedMessages: log.suppressedMessages() };
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
