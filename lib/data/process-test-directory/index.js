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
const { parseTestCSVRowV2: parseTestCSVRow } = require('../parse-test-csv-row');
const { parseCommandCSVRowV2: parseCommandCSVRow } = require('../parse-command-csv-row');
const {
  createAtCommandTuplesATSettingsTestIdLookupByPresentationNumber,
} = require('../command-tuples-at-mode-task-lookup');
const { createExampleScriptsTemplate } = require('../example-scripts-template');
const {
  Utils,
  createExampleScriptedFile,
  createScriptFiles,
  getSetupScriptDescription,
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

  // setup from arguments passed to npm script or test runner
  const utils = new Utils({
    testFormatVersion: 2,
    isVerbose: !!args.verbose,
    isValidate: !!args.validate,
  });

  const { log, VALIDATE_CHECK } = utils.logger;

  /** Name of the test plan. */
  const testPlanName = path.basename(directory);

  // @param rootDirectory is dependent on this file not moving from the `lib/data` folder
  const cwd = path.dirname(__filename);
  const rootDirectory = path.join(cwd, '../../..');

  const testsDirectory = config?.testsDirectory ?? path.join(rootDirectory, 'tests');
  const testPlanDirectory = path.join(testsDirectory, testPlanName);

  const resourcesDirectory = path.join(rootDirectory, 'tests', 'resources');
  const supportJsonFilePath = path.join(rootDirectory, 'tests', 'support.json');
  const commandsJsonFilePath = path.join(rootDirectory, 'tests', 'commands.json');
  const testsCsvFilePath = path.join(testPlanDirectory, 'data', 'tests.csv');
  const referencesCsvFilePath = path.join(testPlanDirectory, 'data', 'references.csv');
  const assertionsCsvFilePath = path.join(testPlanDirectory, 'data', 'assertions.csv');
  const scriptsCsvFilePath = path.join(testPlanDirectory, 'data', 'scripts.csv');

  // build output folders and file paths setup
  const buildDirectory = config?.buildOutputDirectory ?? path.join(rootDirectory, 'build');
  const buildTestsDirectory = path.join(buildDirectory, 'tests');
  const testPlanBuildDirectory = path.join(buildTestsDirectory, testPlanName);
  const indexFileBuildOutputPath = path.join(testPlanBuildDirectory, 'index.html');

  utils.testPlanName = testPlanName;
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

  utils.testPlanRecord = testPlanRecord;
  utils.resourcesRecord = resourcesRecord;
  utils.scriptsRecord = scriptsRecord;
  utils.supportJsonRecord = supportJsonRecord;
  utils.commandsJsonRecord = commandsJsonRecord;

  // Filter out reference html files with inline scripts. Files that are not
  // regenerated will be removed from the filesystem.
  const testPlanUpdate = await utils.getTestPlanUpdateRecord();
  const newBuild = utils.getNewBuild(testPlanUpdate);

  const supportJson = JSON.parse(supportJsonRecord.text);
  const commandsJson = JSON.parse(commandsJsonRecord.text);

  const allAts = supportJson.ats;
  const allAtKeys = allAts.map(({ key }) => key);
  const allAtNames = allAts.map(({ name }) => name);
  const atSettings = allAts
    .map(({ settings }) => settings)
    .flatMap(setting => Object.keys(setting));

  // readingMode and interactionMode are known screen reader 'at modes' found in
  // support.json at ats[].assertionTokens. The specific named modes are
  // stored in ats[].settings
  const validModes = ['readingMode', 'interactionMode', 'defaultMode'].concat(atSettings);

  utils.checkForMissingPath(testPlanRecord, 'directory', { path: testPlanDirectory });
  utils.checkForMissingPath(testPlanRecord, 'file', {
    path: testsCsvFilePath,
    fileName: 'tests.csv',
    shortenedFilePath: 'data/tests.csv',
  });
  utils.checkForMissingPath(testPlanRecord, 'file', {
    path: referencesCsvFilePath,
    fileName: 'references.csv',
    shortenedFilePath: 'data/references.csv',
  });
  utils.checkForMissingPath(testPlanRecord, 'file', {
    path: assertionsCsvFilePath,
    fileName: 'assertions.csv',
    shortenedFilePath: 'data/assertions.csv',
  });
  utils.checkForMissingPath(testPlanRecord, 'file', {
    path: scriptsCsvFilePath,
    fileName: 'scripts.csv',
    shortenedFilePath: 'data/scripts.csv',
  });

  // Get paths to possible at specific *-commands.csvs
  const atCommandsCsvFilePaths = getTestPlanDataFilePaths(
    testPlanDirectory,
    allAtKeys.map(key => `${key}-commands.csv`)
  ).map((atCommandCsvFilePath, index) => ({ atKey: allAtKeys[index], atCommandCsvFilePath }));

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
      `No *-commands.csv files found for tests/${testPlanName}. Please create at least one of the following: ${missingAtCommandsCsvFiles.join(
        ', '
      )}`
    );
  }

  // Common regex patterns found in *.csvs
  const numericKeyFormat = /^_(\d+)$/;
  const idFormat = /^[A-Za-z0-9-]+$/;

  const validReferenceKeys = /^(?:refId|type|value|linkText)$/;
  function validateReferencesKeys(row) {
    // example header:
    // refId,type,value,linkText
    for (const key of Object.keys(row)) {
      if (numericKeyFormat.test(key)) {
        throw new Error(`Column found without header row, ${+key.substring(1) + 1}`);
      } else if (!validReferenceKeys.test(key)) {
        throw new Error(`Unknown references.csv key: ${key} - check header row?`);
      }
    }
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
  const assertionsExceptionsFormat = /^([0123]:[a-zA-Z-\d]+\s*)+$/;
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
    if (!idFormat.test(row.testId))
      throw new Error('testId does not match the expected format: ' + row.testId);
    if (row.settings && !settingsFormat.test(row.settings))
      throw new Error('settings does not match the expected format: ' + row.settings);
    if (row.assertionExceptions && !assertionsExceptionsFormat.test(row.assertionExceptions))
      throw new Error(
        'assertionExceptions does not match the expectedFormat: ' + row.assertionExceptions
      );
    if (!Number(row.presentationNumber) > 0)
      throw new Error(
        'presentationNumber does not match the expected format: ' + row.presentationNumber
      );
    return row;
  }

  const validTestsKeys =
    /^(?:testId|title|presentationNumber|setupScript|instructions|assertions)$/;
  const titleFormat = /^[A-Z]([A-Za-z-',\s]){2,}[^.]$/;
  const assertionsFormat = /^(([0123]:)?[a-zA-Z-\d]+\s*)+$/;
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
    if (!idFormat.test(row.testId))
      throw new Error('testId does not match the expected format: ' + row.testId);
    if (!titleFormat.test(row.title))
      throw new Error('title does not match the expected format: ' + row.title);
    if (row.assertions && !assertionsFormat.test(row.assertions))
      throw new Error('assertions does not match the expectedFormat: ' + row.assertions);
    if (!Number(row.presentationNumber) > 0)
      throw new Error(
        'presentationNumber does not match the expected format: ' + row.presentationNumber
      );
    return row;
  }

  const validAssertionsKeys =
    /^(?:assertionId|priority|assertionStatement|assertionPhrase|refIds)$/;
  const priorityFormat = /^[123]$/;
  // TODO: The make-v2 script isn't removing the punctuations at the end which violates the requirements of this
  //  column's validation. Based on https://github.com/w3c/aria-at/wiki/Test-Format-Definition-V2#assertionstatement
  //  Please ensure they are removing and use the commented regex instead.
  const assertionStatementFormat = /^[A-Z].*[a-zA-Z'{}().](?![.!?])$/;
  // const assertionStatementFormat = /^[A-Z].*[a-zA-Z'{}()](?![.!?])$/;

  // TODO: Same as TODO above. Based on https://github.com/w3c/aria-at/wiki/Test-Format-Definition-V2#assertionphrase
  const assertionPhraseFormat = /^[a-z].*[a-zA-Z'"{}()\d+.](?![.!?])$/;
  // const assertionPhraseFormat = /^[a-z].*[a-zA-Z'"{}()\d+](?![.!?])$/;
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
      throw new Error('assertionId does not match the expected format: ' + row.assertionId);
    if (!priorityFormat.test(row.priority))
      throw new Error('priority does not match the expected format: ' + row.priority);
    if (!assertionStatementFormat.test(row.assertionStatement))
      throw new Error(
        'assertionStatement does not match the expected format: ' + row.assertionStatement
      );
    if (!assertionPhraseFormat.test(row.assertionPhrase))
      throw new Error('assertionPhrase does not match the expected format: ' + row.assertionPhrase);
    return row;
  }

  const validScriptsKeys = /^(?:setupScript|setupScriptDescription)$/;
  const setupScriptDescriptionFormat = /^[a-z].*[a-zA-Z'](?![.!?])$/;
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
      throw new Error(
        'setupScriptDescription does not match the expected format: ' + row.setupScriptDescription
      );
    return row;
  }

  const [testsCsv, assertionsCsv, scriptsCsv, referencesCsv, ...atCommandsCsvs] = await Promise.all(
    [
      utils.readCSVFile('data/tests.csv', validateTestsKeys),
      utils.readCSVFile('data/assertions.csv', validateAssertionsKeys),
      utils.readCSVFile('data/scripts.csv', validateScriptsKeys),
      utils.readCSVFile('data/references.csv', validateReferencesKeys),
      ...atCommandsCsvFilePaths.map(({ atKey }) =>
        utils.readCSVFile(`data/${atKey}-commands.csv`, validateCommandsKeys)
      ),
    ]
  );

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
   * @param {function(filePath: string, content: any, encoding: string)} options.emitFile
   * @param {FileRecordChain} options.scriptsRecord
   * @param {Queryable<T>} options.exampleScriptedFilesQueryable
   * @returns {(string|*[])[]}
   */
  function createTestFile(
    test,
    refs,
    atCommandsMap,
    { emitFile, scriptsRecord, exampleScriptedFilesQueryable }
  ) {
    // default setupScript if test has undefined setupScript
    if (!scriptsRecord.find(`${test.setupScript?.script}.js`).isFile()) {
      test.setupScript = {
        ...test.setupScript,
        script: '',
      };
    }

    function getTestId(testId) {
      if (typeof atCommandsMap[testId] !== 'object') {
        utils.addTestError(test.testId, '"' + testId + '" does not exist in *-commands.csv file.');
      }
      return testId;
    }

    function getModeValue({ settings }) {
      let v = settings.trim().split(' ');
      if (!v.every(el => validModes.includes(el))) {
        utils.addTestError(
          test.testId,
          '"' +
            settings +
            '" is not valid value for "settings" property. Check again that each setting is correctly spelt.'
        );
      }
      return v;
    }

    function getExampleReferences(test, refs) {
      let links = '';

      test.references.forEach(({ refId }) => {
        const { value: link, linkText } = refs[refId];

        if (typeof link === 'string' && link.length) {
          links += `<link rel="help" href="${link}" title="${linkText}">\n`;
        }
      });

      return links;
    }

    // Prepare file name descriptors
    let testId = getTestId(test.testId);
    let modes = test.target.ats.map(getModeValue).join('_');

    test.target.ats.forEach(at => {
      if (atCommandsMap[testId]) {
        if (!atCommandsMap[testId][at.settings][at.key]) {
          utils.addTestError(
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

    // Define file names - testId and test level presentationNumber should be enough of a descriptor to differentiate the values
    const testFileName = `test-${test.presentationNumber.toString().padStart(2, '0')}-${testId}`;
    const testPlanHtmlFileBuildPath = path.join(testPlanBuildDirectory, `${testFileName}.html`);
    const testPlanJsonFileBuildPath = path.join(testPlanBuildDirectory, `${testFileName}.json`);

    const exampleReferences = getExampleReferences(test, refs);
    const scriptsContent = [...utils.addSetupScript(testId, test.setupScript.script)];

    /** @type {AriaATFile.Behavior} */
    let testData = {
      task: testId,
      mode: modes,
      applies_to: [...new Set(test.target.ats.map(({ key }) => key))],
      setup_script_description: getSetupScriptDescription(test.setupScript.scriptDescription),
      specific_user_instruction: test.instructions,
      setupTestPage: test.setupScript.script,
      testPlanStrings: supportJson.testPlanStrings,
      output_assertions: test.assertions,
      commandsInfo: test.commandsInfo,
    };

    const testHtml = utils.getTestHtml({
      title: test.title,
      testJson: JSON.stringify(testData, null, 2),
      scriptsJs: utils.getScriptsJs(scriptsContent),
      commandsJson: beautify({ [testId]: atCommandsMap[testId] }, null, 2, 40),
      exampleReferences,
      testPageAndInstructionsPath: JSON.stringify(
        exampleScriptedFilesQueryable.where({
          name: test.setupScript ? test.setupScript.script : '',
        }).path
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
    let atHeaders = '';

    allAtNames.forEach(at => (atHeaders += '<th>' + at + '</th>\n'));
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

  // Works because the order of allAtKeys and atCommandsCsvs should be maintained up this point
  const parsedAtCommandsCsvs = allAtKeys.map((atKey, index) => ({
    atKey,
    commands: atCommandsCsvs[index],
  }));
  const testsParsed = parseTestCSVRow({
    tests: testsCsv,
    assertions: assertionsCsv,
    scripts: scriptsCsv,
    commands: parsedAtCommandsCsvs,
  });
  const scriptsSource = loadScriptsSource(scriptsRecord);
  const commandsParsed = parseCommandCSVRow(
    {
      commands: parsedAtCommandsCsvs,
    },
    commandsJson
  );
  const {
    references: { aria, htmlAam },
  } = supportJson;
  const referencesParsed = utils.parseReferencesCSV(referencesCsv, { aria, htmlAam });

  const keyDefs = utils.getKeyDefs();
  const keysParsed = utils.parseKeyMap(keyDefs);
  const supportParsed = parseSupport(supportJson);

  const keysValidated = utils.validateKeyMap(keysParsed, {
    addKeyMapError: utils.addKeyMapError,
  });

  // Retrieve queryables
  const supportQueryables = {
    ats: Queryable.from('ats', supportParsed.ats),
    atGroups: Queryable.from('atGroups', supportParsed.atGroups),
    references: Queryable.from('references', supportParsed.ats),
    testPlanStrings: Queryable.from('testPlanStrings', supportParsed.ats),
  };
  const keyQueryable = Queryable.from('key', keysValidated);
  const referenceQueryable = Queryable.from('reference', referencesParsed);

  const commandLookups = {
    key: keyQueryable,
    support: supportQueryables,
  };
  const commandsValidated = commandsParsed.map(command =>
    validateCommand(command, commandLookups, {
      addCommandError: utils.addCommandError,
      addCommandAssertionExceptionError: utils.addCommandAssertionExceptionError,
    })
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
    log.error(
      `ERROR: Valid 'reference' value not found in "tests/${testPlanName}/data/references.csv".`
    );
  }
  const exampleRecord = testPlanRecord.find(examplePathOriginal);
  if (!exampleRecord.isFile()) {
    log.error(
      `ERROR: Invalid 'reference' value path "${examplePathOriginal}" found in "tests/${testPlanName}/data/references.csv".`
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
    return test.target.ats.map(({ key, settings }) =>
      collectTestData({
        test,
        command: commandQueryable.where({
          testId: test.testId,
          target: { at: { key, settings } },
        }),
        reference: referenceQueryable,
        supportAt: supportQueryables.ats,
        example: exampleScriptedFilesQueryable,
        modeInstructionTemplate: utils.MODE_INSTRUCTION_TEMPLATES_QUERYABLE(supportJson),
      })
    );
  });

  // So there can be a single {at}.collected.(json|html) instead of
  // multiple {at}-{settings}.collected.(json|html)
  let combinedCollectedTests = [];
  const _testsCollected = JSON.parse(JSON.stringify(testsCollected.slice(0)));

  // { eg. jaws: [ ... ], nvda: [ ... ], vo: [ ... ] }
  const collectedTestsGroupedByAt = {};
  allAtKeys.forEach(atKey => {
    collectedTestsGroupedByAt[atKey] = _testsCollected.filter(
      collected => collected.target.at.key === atKey
    );
  });

  for (const key in collectedTestsGroupedByAt) {
    const collectedTestAtGroup = collectedTestsGroupedByAt[key];

    // Get the unique testIds found for the at
    const collectedTestsGroupedByAtTestIds = [
      ...new Set(collectedTestAtGroup.map(c => c.info.testId)),
    ];

    // Group by the testIds
    for (const testId of collectedTestsGroupedByAtTestIds) {
      const collectedTestsGroupedByAtGroupedByTestIds = collectedTestAtGroup.filter(
        c => c.info.testId === testId
      );

      // Declare a common collectedTest that will be modified (if needed)
      let common = collectedTestsGroupedByAtGroupedByTestIds[0];
      const settings = common.target.at.settings;
      common = {
        ...common,
        instructions: {
          ...common.instructions,
          mode: { [settings]: common.instructions.mode },
        },
        commands: common.commands.map(command => ({
          ...command,
          settings,
        })),
      };

      // Iterate over the remaining collected tests
      if (collectedTestsGroupedByAtGroupedByTestIds.length > 1) {
        for (const additional of collectedTestsGroupedByAtGroupedByTestIds.slice(1)) {
          const settings = additional.target.at.settings;

          common.target.at.settings = `${common.target.at.settings}_${settings}`;
          common.instructions.mode[settings] = additional.instructions.mode;
          common.commands.push(
            ...additional.commands.map(command => ({
              ...command,
              settings,
            }))
          );
        }
      }

      combinedCollectedTests.push(common);
    }
  }

  const buildFiles = [
    ...createScriptFiles(scriptsSource, testPlanBuildDirectory),
    ...exampleScriptedFiles.map(({ path: pathSuffix, content }) => ({
      path: path.join(buildTestsDirectory, testPlanName, pathSuffix),
      content,
    })),
    // TODO: If there is a need to individually view jaws-pcCursor or nvda-browseMode for example
    // ...testsCollected.map(collectedTest =>
    //   createCollectedTestFile(collectedTest, testPlanBuildDirectory)
    // ),
    // ...testsCollected.map(collectedTest =>
    //   createCollectedTestHtmlFile(collectedTest, testPlanBuildDirectory)
    // ),
    ...combinedCollectedTests.map(collectedTest => {
      const presentationNumber = parseInt(collectedTest.info.presentationNumber)
        .toString()
        .padStart(2, '0');
      const fileName = `test-${presentationNumber}-${collectedTest.info.testId}-${collectedTest.target.at.key}`;
      return utils.createCollectedTestFile(collectedTest, testPlanBuildDirectory, fileName);
    }),
    ...combinedCollectedTests.map(collectedTest => {
      const presentationNumber = parseInt(collectedTest.info.presentationNumber)
        .toString()
        .padStart(2, '0');
      const fileName = `test-${presentationNumber}-${collectedTest.info.testId}-${collectedTest.target.at.key}`;
      return utils.createCollectedTestHtmlFile(collectedTest, testPlanBuildDirectory, fileName);
    }),
  ];
  buildFiles.forEach(file => emitFile(file.path, file.content));
  scriptedFiles.forEach(file =>
    generateSourceHtmlScriptFile(path.join(testsDirectory, testPlanName, file.path), file.content)
  );

  const atCommandsMap =
    createAtCommandTuplesATSettingsTestIdLookupByPresentationNumber(commandsValidated);

  emitFile(
    path.join(testPlanBuildDirectory, 'commands.json'),
    beautify(atCommandsMap, null, 2, 40)
  );

  log('Creating the following test files: ');
  testsParsed.forEach(function (testParsed, index) {
    try {
      const [url, applies_to_at] = createTestFile(testParsed, refs, atCommandsMap, {
        emitFile,
        scriptsRecord,
        exampleScriptedFilesQueryable,
      });

      indexOfURLs.push({
        seq: index + 1,
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

  if (utils.errorCount) {
    log.warning(
      `*** ${utils.errorCount} Errors in tests and/or commands in test plan [tests/${testPlanName}] ***`
    );
    log.warning(utils.errors);
  } else {
    log(`No validation errors detected for tests/${testPlanName}\n`);
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
          const key = data.key.where({ id: keypress.id });
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
  const assertionStringTokenPattern = /\{([^{}]+)}/g;
  const replacedAssertionStrings = (str, matches, replacements) => {
    matches.forEach(match => (str = str.replaceAll(match, replacements[match.slice(1, -1)])));
    return str;
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
    at.settings.split(' ').forEach(setting => {
      if (!data.mode.where(setting)) {
        addTestError(`"${at.settings}" is not valid value for "settings" property.`);
      }
    });
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
    assertion.tokenizedAssertionPhrases = {};

    // There are assertionStatement tokens to account for
    if (assertion.assertionStatement.includes('|')) {
      const [genericAssertionStatement, tokenizedAssertionStatement] =
        assertion.assertionStatement.split('|');

      // Set fallback just in case tokenized statement or properties do not exist
      assertion.assertionStatement = genericAssertionStatement;

      if (tokenizedAssertionStatement) {
        const matches = tokenizedAssertionStatement.match(assertionStringTokenPattern);

        testParsed.target.ats.forEach(at => {
          const { assertionTokens } = data.support.ats.where({ key: at.key });
          const tokensExist =
            assertionTokens && matches.every(match => assertionTokens[match.slice(1, -1)]);

          if (tokensExist) {
            assertion.tokenizedAssertionStatements[at.key] = replacedAssertionStrings(
              tokenizedAssertionStatement,
              matches,
              assertionTokens
            );
          }
        });
      }
    }

    // There are assertionPhrase tokens to account for
    if (assertion.assertionPhrase.includes('|')) {
      const [genericAssertionPhrase, tokenizedAssertionPhrase] =
        assertion.assertionPhrase.split('|');

      // Set fallback just in case tokenized statement or properties do not exist
      assertion.assertionPhrase = genericAssertionPhrase;

      if (tokenizedAssertionPhrase) {
        const matches = tokenizedAssertionPhrase.match(assertionStringTokenPattern);

        testParsed.target.ats.forEach(at => {
          const { assertionTokens } = data.support.ats.where({ key: at.key });
          const tokensExist =
            assertionTokens && matches.every(match => assertionTokens[match.slice(1, -1)]);

          if (tokensExist) {
            assertion.tokenizedAssertionPhrases[at.key] = replacedAssertionStrings(
              tokenizedAssertionPhrase,
              matches,
              assertionTokens
            );
          }
        });
      }
    }

    if (
      typeof assertion.priority === 'string' ||
      (assertion.priority !== 0 &&
        assertion.priority !== 1 &&
        assertion.priority !== 2 &&
        assertion.priority !== 3)
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
 * @param {Queryable<{screenText: string, instructions: [string]}>} data.supportAt
 * @param {Queryable<{name: string, path: string}>} data.example
 * @param {Queryable<{at: string, mode: string, render: function({key: *}): string}>} data.modeInstructionTemplate
 * @returns {AriaATFile.CollectedTest}
 */
function collectTestData({ test, command, supportAt, example, modeInstructionTemplate }) {
  const isSingleSetting = command.target.at.settings.split(' ').length <= 1;
  return {
    info: {
      testId: test.testId,
      title: test.title,
      references: test.references,
      presentationNumber: test.presentationNumber,
    },
    target: {
      ...test.target,
      at: { ...command.target.at, raw: supportAt.where({ key: command.target.at.key }) },
      referencePage: example.where({ name: test.setupScript ? test.setupScript.name : '' }).path,
      setupScript: test.setupScript,
    },
    instructions: {
      instructions: test.instructions,
      mode: isSingleSetting
        ? modeInstructionTemplate.where({
            at: command.target.at.key,
            mode: command.target.at.settings,
          }).render
        : command.target.at.settings.split(' ').map(setting => {
            return modeInstructionTemplate.where({
              at: command.target.at.key,
              mode: setting,
            }).render;
          }),
    },
    commands: command.commands,
    assertions: test.assertions,
  };
}
