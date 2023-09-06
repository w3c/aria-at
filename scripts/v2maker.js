const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const util = require(path.join(__dirname, 'v2makerUtil.js'));
const v2json = require(path.join(__dirname, 'v2maker.json'));

// inputs
const csvInputFiles = new Map([
  ['v1tests', 'testsV1.csv'],
  ['v1commands', 'commands.csv'],
  ['v1references', 'referencesV1.csv'],
  ['assertionSubstitutions', path.join(__dirname, 'v2substitutionsForAssertionIds.csv')],
  ['testSubstitutions', path.join(__dirname, 'v2substitutionsForTestIds.csv')],
  ['commandSubstitutions', path.join(__dirname, 'v2substitutionsForCommands.csv')],
]);

// outputs
let testsFile = 'tests.csv';
let assertionsFile = 'assertions.csv';
let jawsCommandsFile = 'jaws-commands.csv';
let nvdaCommandsFile = 'nvda-commands.csv';
let voCommandsFile = 'voiceover_macos-commands.csv';
let scriptsFile = 'scripts.csv';
let referencesFile = 'references.csv';

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
  },
});

if (args.help) {
  console.log(`
  v2maker requires one argument: the name of the test plan directory.
  The data subdirectory of the test plan directory must contain:
    test.csv
    commands.csv
    references.csv

  If backup copies of the original V1 format tests.csv and references.csv have not been created by a prior run, the tests.csv and references.csv will be copied to testsV1.csv and referencesV1.csv before their content is replaced with the new V2 formatted content.

  Arguments:
    -h, --help
      Show this message.
  `);
  process.exit();
}

if (args._.length !== 1) {
  console.log(
    `Name of a test plan directory that is a subdirectory of the 'tests' directory is required.`
  );
  process.exit();
}

main();

async function main() {
  try {
    const testPlan = args._[0];
    testDataPath = path.join(__dirname, '..', 'tests', testPlan, 'data');
    await util.startLoggingTo(path.join(testDataPath, 'log.txt'), 'both');
    await setupFilePaths(testDataPath);
    const csvData = await readCsvFiles();
    const haveRequiredData = await isV1dataAvailable(csvData);
    if (!haveRequiredData) process.exit(1);
    let assertionRows = await makeAssertionsCsvData(csvData);
    const v1ToV2testIdMap = await makeTestsCsvData(csvData, assertionRows);
    await makeCommandsCsvData(csvData, v1ToV2testIdMap);
    await makeScriptsCsvData(csvData);
    await makeReferencesCsvData(csvData);
    await util.logMessage(`\nFinished conversion at ${new Date().toISOString()}`);
  } catch (error) {
    console.error('Error!', error);
  }
}

async function setupFilePaths(testDataPath) {
  // Set absolute file paths for all inputs and outputs.
  // Also, if the v1 tests and references files have not been copied to preserve their content, perform the copy operation.

  // Configure file paths for the files that are in the test plan data directory.
  // inputs
  csvInputFiles.set('v1tests', path.join(testDataPath, csvInputFiles.get('v1tests')));
  csvInputFiles.set('v1commands', path.join(testDataPath, csvInputFiles.get('v1commands')));
  csvInputFiles.set('v1references', path.join(testDataPath, csvInputFiles.get('v1references')));

  // outputs
  testsFile = path.join(testDataPath, testsFile);
  assertionsFile = path.join(testDataPath, assertionsFile);
  jawsCommandsFile = path.join(testDataPath, jawsCommandsFile);
  nvdaCommandsFile = path.join(testDataPath, nvdaCommandsFile);
  voCommandsFile = path.join(testDataPath, voCommandsFile);
  scriptsFile = path.join(testDataPath, scriptsFile);
  referencesFile = path.join(testDataPath, referencesFile);

  // If the tests and references files have not yet been copied to testsV1.csv and referencesV1.csv, copy them.
  // The content of the original v1 files will be overwritten with the new v2 content when making the v2 conversion.
  if (!fs.existsSync(csvInputFiles.get('v1tests'))) {
    try {
      await fs.promises.copyFile(testsFile, csvInputFiles.get('v1tests'));
      const logMsg = `Copied ${path.basename(testsFile)} to ${path.basename(
        csvInputFiles.get('v1tests')
      )}`;
      await util.logMessage(logMsg);
    } catch (copyErr) {
      throw new Error(`Error copying ${testsFile} to ${csvInputFiles.get('v1tests')}: ${copyErr}`);
    }
  }
  if (!fs.existsSync(csvInputFiles.get('v1references'))) {
    try {
      await fs.promises.copyFile(referencesFile, csvInputFiles.get('v1references'));
      const logMsg = `Copied ${path.basename(referencesFile)} to ${path.basename(
        csvInputFiles.get('v1references')
      )}`;
      await util.logMessage(logMsg);
    } catch (copyErr) {
      throw new Error(
        `Error copying ${referencesFile} to ${csvInputFiles('v1references')}: ${copyErr}`
      );
    }
  }
}

async function readCsvFiles() {
  const csvData = {};
  const filePromises = Array.from(csvInputFiles.entries()).map(
    async ([fileDescriptor, fileName]) => {
      const stream = fs.createReadStream(fileName, 'utf8');
      const rows = [];
      return new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on('data', row => {
            rows.push(row);
          })
          .on('end', () => {
            csvData[fileDescriptor] = rows;
            resolve();
          })
          .on('error', error => {
            reject(error);
          });
      });
    }
  );

  await Promise.all(filePromises);
  return csvData;
}

async function isV1dataAvailable(allInputCsvData) {
  /**
   * Make sure the testsV1.csv has V1 columns.
   * If it  does not, assume it contains V2 data and the V1 data is not available in the data  directory.
   * If V1 data is not available, delete the testsV1.csv file that was  most likely created by the setupFilePaths method.
   */

  let v1dataAvailable = true;

  // Make sure that the testsV1 columns include the following. Require only 1 assertion column.
  const v1columns = [
    'testId',
    'title',
    'appliesTo',
    'mode',
    'task',
    'setupScript',
    'setupScriptDescription',
    'refs',
    'instructions',
    'assertion1',
  ];
  let missingColumns = [];
  const inputRow = allInputCsvData.v1tests[0];
  for (column of v1columns) {
    if (!(column in inputRow)) missingColumns.push(column);
  }
  if (missingColumns.length > 0) {
    v1dataAvailable = false;
    await util.deleteFile(csvInputFiles.get('v1tests'));
    await util.logMessage(`
  ${path.basename(csvInputFiles.get('v1tests'))} is missing the following columns: ${missingColumns}
  Deleted ${path.basename(csvInputFiles.get('v1tests'))}.
  `);
  }

  return v1dataAvailable;
}

async function makeAssertionsCsvData(allInputCsvData) {
  await util.logMessage(`\nCreating ${path.basename(assertionsFile)}`);

  // pull data from the assertion1 through assertionN columns of the v1tests array in allInputCsvData.
  let assertions = [];
  for (const row of allInputCsvData.v1tests) {
    // properties in the row objects match columns in the input file:
    // testId,title,appliesTo,mode,task,setupScript,setupScriptDescription,refs,instructions,assertion1,assertion2,assertion3,assertion4,assertion5,assertion6,assertion7
    const colNames = Object.keys(row);
    for (const colName of colNames) {
      if (colName.startsWith('assertion')) {
        if (row[colName].trim() !== '') {
          assertions.push(row[colName]);
        }
      }
    }
  }

  // Separate p1 and p2 assertions.
  let p1assertions = assertions.filter(assertion => !assertion.includes('2:'));
  let p2assertions = assertions.filter(assertion => assertion.includes('2:'));
  // Remove the prefixes from the p2 assertions.
  p2assertions = p2assertions.map(assertion => assertion.replace('2:', ''));
  // Get rid of duplicates.
  p1assertions = [...new Set(p1assertions)];
  p2assertions = [...new Set(p2assertions)];
  // Remove p1 assertions that are the same as a p2 assertion.
  for (const p2assertion of p2assertions) {
    if (p1assertions.includes(p2assertion)) {
      await util.logMessage(
        `P1 and P2 priorities found for assertion '${p2assertion}. Keeping only the P2 priority.`
      );
      p1assertions = p1assertions.filter(p1assertion => p1assertion !== p2assertion);
    }
  }

  // to make assertionIds, we need the substitutions and deletions data.
  const { deletions, substitutions } = util.getSubstitutionsAndDeletions(
    'assertionSubstitutions',
    allInputCsvData,
    'oldWords',
    'newWords'
  );

  // Start making rows for the output CSV file.
  let assertionRows = [];
  for (const assertion of p1assertions) {
    let newRow = {};
    newRow.assertionId = util.makeId(util.trimQuotes(assertion), substitutions, deletions);
    newRow.priority = '1';
    newRow.assertionStatement = util.sentenceCase(assertion);
    const phrase = assertion.replace(
      /("?)(\w)((?:.*?),?(?:.*?))((?:,\s+is|\s+is)\s+conveyed)("?)/g,
      '$1Convey $2$3$5'
    );
    newRow.assertionPhrase = util.phraseCase(phrase);
    newRow.refIds = '';
    assertionRows.push(newRow);
  }
  for (const assertion of p2assertions) {
    let newRow = {};
    newRow.assertionId = util.makeId(util.trimQuotes(assertion), substitutions, deletions);
    newRow.priority = '2';
    newRow.assertionStatement = util.sentenceCase(assertion);
    const phrase = assertion.replace(
      /("?)(\w)((?:.*?),?(?:.*?))((?:,\s+is|\s+is)\s+conveyed)("?)/g,
      '$1Convey $2$3$5'
    );
    newRow.assertionPhrase = util.phraseCase(phrase);
    newRow.refIds = '';
    assertionRows.push(newRow);
  }

  // Sort rows by assertionId ascending
  assertionRows.sort((a, b) => {
    const valueA = a.assertionId;
    const valueB = b.assertionId;
    if (valueA < valueB) {
      return -1;
    }
    if (valueA > valueB) {
      return 1;
    }
    return 0;
  });

  // Write rows to CSV file
  const rowWriter = createCsvWriter({
    path: assertionsFile,
    header: Object.keys(assertionRows[0]).map(column => ({ id: column, title: column })),
  });
  await rowWriter.writeRecords(assertionRows);
  await util.logMessage(
    `Wrote ${assertionRows.length} assertion statements to ${path.basename(assertionsFile)}`
  );

  return assertionRows;
}

async function makeTestsCsvData(allInputCsvData, assertionRows) {
  await util.logMessage(`\nCreating ${path.basename(testsFile)}.`);

  // to make testIds, we will need the substitutions and deletions data.
  const { deletions, substitutions } = util.getSubstitutionsAndDeletions(
    'testSubstitutions',
    allInputCsvData,
    'oldWords',
    'newWords'
  );

  // To convert assertions to assertionIds, we will need a map of assertionStatements to assertionIds. So comparisons can be case insensitive, we'll lowercase the keys.
  const assertionStatementsToIds = new Map();
  for (row of assertionRows) {
    assertionStatementsToIds.set(row.assertionStatement.toLowerCase(), row.assertionId);
  }

  // pull the data for the rows of the new tests file from the columns of the v1tests array in allInputCsvData.
  let v2testRows = [];
  for (const row of allInputCsvData.v1tests) {
    // properties in the row objects match columns in the input file:
    // testId,title,appliesTo,mode,task,setupScript,setupScriptDescription,refs,instructions,assertion1,assertion2,assertion3,assertion4,assertion5,assertion6,assertion7
    let newRow = {};
    // Add properties to newRow in the order that the columns will appear in the new tests.csv file.
    newRow.testId = util.makeId(util.trimQuotes(row.title), substitutions, deletions);
    newRow.title = util.sentenceCase(
      row.title.replace(/read\s+information\s+about/i, 'Request information about')
    );
    newRow.presentationNumber = row.testId;
    newRow.setupScript = row.setupScript;
    newRow.instructions = row.instructions;
    let assertions = '';
    // Loop through the assertion columns, get the assertionId for each, and join them with spaces.
    const colNames = Object.keys(row);
    for (const colName of colNames) {
      if (colName.startsWith('assertion')) {
        if (row[colName].trim() !== '') {
          // Remove priority prefix if present.
          const v1assertion = row[colName].replace('2:', '');
          // get the v2 assertion Id and add it to the assertions string. Do lookups and comparisons using lowercase. Keeping the original case for the log in the event the assertion is not found.
          if (assertionStatementsToIds.has(v1assertion.toLowerCase())) {
            assertions += ` ${assertionStatementsToIds.get(v1assertion.toLowerCase())}`;
          } else
            await util.logMessage(
              `assertionId not found for '${v1assertion} when processing testId ${row.testId}.`
            );
        }
      }
    }
    newRow.assertions = assertions.trim();
    v2testRows.push(newRow);
  }

  // Sort rows by presentationNumber ascending
  v2testRows.sort((a, b) => {
    const valueA = Number(a.presentationNumber);
    const valueB = Number(b.presentationNumber);
    if (valueA < valueB) {
      return -1;
    }
    if (valueA > valueB) {
      return 1;
    }
    return 0;
  });

  /* 
    We will be filtering testRows to keep only the rows for the VoiceOver tests. We want to get rid of all the tests that specify reading mode or interaction mode.
    However, before removing those obsolete tests, there is some data we need to collect from them:
    1. A map of all the v1 testIds to v2 testIds to use during conversion of commands.csv.
    2. Determine whether there are test tasks where JAWS and NVDA have assertions that are not specified for VoiceOver.
    If there are tests where JAWS and NVDA have assertions that are not specified for VoiceOver, we'll log a warning for each task/assertion pair specified for JAWS and NVDA that is not specified for VoiceOver.

    Note: It's better to log a warning than combine all the assertions that appear to be different because they might not actually be different in meaning.
    Sometimes there are two different wordings of the same assertion.
   */
  // Build a map that specifies which new v2testId  to use in place of a v1testId in commands.csv.
  const v1ToV2testIds = new Map();
  for (row of v2testRows) {
    v1ToV2testIds.set(row.presentationNumber, row.testId);
  }

  // Get a set containing all the tasks in the test plan.
  const v1tasks = new Set(allInputCsvData.v1tests.map(row => row.task));
  // iterate through the tasks and compare the VoiceOver assertions to the the JAWS and NVDA assertions.
  for (const task of v1tasks) {
    // Find the v1testId for the VoiceOver test for this task in the v1testRows array.
    const voiceOverV1TestId = allInputCsvData.v1tests.find(
      row => row.task === task && row.appliesTo.toLowerCase().includes('voiceover')
    ).testId;
    // Use the v1testId to extract the VoiceOver assertions column for this task from the v2testRows. It contains a space-delimited set of assertionIds.
    // Note that the v1testId was stored in the presentationNumber property in v2testRows.
    const voiceOverAssertions = v2testRows.find(
      row => row.presentationNumber === voiceOverV1TestId
    ).assertions;
    // Get array of v1testIds for JAWS and NVDA for this task.
    const jawsAndNvdaV1testIds = allInputCsvData.v1tests
      .filter(row => row.task === task && row.appliesTo.toLowerCase().search(/jaws|nvda/) >= 0)
      .map(row => row.testId);
    for (const v1testId of jawsAndNvdaV1testIds) {
      const jawsAndNvdaAssertions = v2testRows
        .find(row => row.presentationNumber === v1testId)
        .assertions.split(' ');
      let loggedWarnings = '';
      for (const assertion of jawsAndNvdaAssertions) {
        if (!voiceOverAssertions.includes(assertion)) {
          if (!loggedWarnings.includes(assertion)) {
            const v2testId = v2testRows.find(row => row.presentationNumber === v1testId).testId;
            const msg =
              `Warning! In ${csvInputFiles.get(
                'v1tests'
              )},  task ${task} specified assertionId ${assertion} for JAWS and  NVDA but not VoiceOver.\n` +
              `${assertion} has been left out of ${testsFile} for testId ${v2testId}. Make sure ${assertion} has the same meaning as another assertion that is specified for ${v2testId}.`;
            await util.logMessage(msg);
          }
        }
      }
    }
  }

  // Now filter v2testRows down to just the VoiceOver rows.
  // First, get an array of just the voiceOver rows from v1tests.
  const v1voiceOverRows = allInputCsvData.v1tests.filter(row =>
    row.appliesTo.toLowerCase().includes('voiceover')
  );
  // Build a set  of the v1 testIds for the VoiceOver tests.
  const voiceOverV1testIds = new Set(v1voiceOverRows.map(row => row.testId));
  // Filter v2testRows. Note that the presentationNumber property contains the v1testId.
  v2testRows = v2testRows.filter(row => voiceOverV1testIds.has(row.presentationNumber));

  // Write rows to CSV file
  const rowWriter = createCsvWriter({
    path: testsFile,
    header: Object.keys(v2testRows[0]).map(column => ({ id: column, title: column })),
  });
  await rowWriter.writeRecords(v2testRows);
  await util.logMessage(`Wrote ${v2testRows.length} tests to ${path.basename(testsFile)}`);

  return v1ToV2testIds;
}

async function makeCommandsCsvData(allInputCsvData, v1ToV2testIds) {
  /* 
    The V1 columns are:
    testId,task,mode,at,commandA,commandB,commandC...
    The V2 columns are:
    testId,command,settings,assertionExceptions,presentationNumber
   */

  const v1commandRows = allInputCsvData['v1commands'];
  const screenReaders = ['jaws', 'nvda', 'voiceover'];
  for (const screenReader of screenReaders) {
    // set output file
    let outputFile = '';
    let readingModeSetting = '';
    let interactionModeSetting = '';
    switch (screenReader) {
      case 'jaws':
        outputFile = jawsCommandsFile;
        readingModeSetting = 'virtualCursor';
        interactionModeSetting = 'pcCursor';
        break;
      case 'nvda':
        outputFile = nvdaCommandsFile;
        readingModeSetting = 'browseMode';
        interactionModeSetting = 'focusMode';
        break;
      case 'voiceover':
        outputFile = voCommandsFile;
        readingModeSetting = 'quickNavOn';
        break;
    }
    await util.logMessage(`\nCreating ${path.basename(outputFile)}.`);

    // Get the set of v1commandRows for this screenReader.
    let screenReaderV1commandRows = v1commandRows.filter(row =>
      row.at.toLowerCase().includes(screenReader)
    );
    let v2commandRows = [];
    for (const row of screenReaderV1commandRows) {
      // Make an array of the commands from the columns for commandA, commandB, etc.
      let commands = [];
      const colNames = Object.keys(row);
      for (const colName of colNames) {
        if (colName.toLowerCase().startsWith('command')) {
          if (row[colName].trim() !== '') commands.push(row[colName]);
        }
      }

      // Make a new row for each command.
      for (const [index, command] of commands.entries()) {
        let newRow = {};
        newRow.testId = v1ToV2testIds.get(row.testId);
        const { commandSequence, commandSettings } = util.translateCommand(
          screenReader,
          command,
          allInputCsvData.commandSubstitutions
        );
        newRow.command = commandSequence;
        if (commandSettings.trim() !== '') newRow.settings = commandSettings;
        else if (row.mode.toLowerCase().includes('reading')) newRow.settings = readingModeSetting;
        else if (row.mode.toLowerCase().includes('interaction'))
          newRow.settings = interactionModeSetting;
        else newRow.settings = '';
        newRow.assertionExceptions = '';
        newRow.presentationNumber = (Number(row.testId) + 0.1 * index).toFixed(1);
        v2commandRows.push(newRow);
      }
    }

    // Write rows to CSV file
    const rowWriter = createCsvWriter({
      path: outputFile,
      header: Object.keys(v2commandRows[0]).map(column => ({ id: column, title: column })),
    });
    await rowWriter.writeRecords(v2commandRows);
    await util.logMessage(`Wrote ${v2commandRows.length} commands to ${path.basename(outputFile)}`);
  }
}

async function makeScriptsCsvData(allInputCsvData) {
  await util.logMessage(`\nCreating ${path.basename(scriptsFile)}.`);

  // pull data from the setupScript and setupScriptDescription columns of the v1tests array in allInputCsvData.
  let scriptRows = [];
  for (const row of allInputCsvData.v1tests) {
    // properties in the row objects match columns in the input file:
    // testId,title,appliesTo,mode,task,setupScript,setupScriptDescription,refs,instructions,assertion1,assertion2,assertion3,assertion4,assertion5,assertion6,assertion7
    let newRow = {};
    newRow.setupScript = row.setupScript;
    newRow.setupScriptDescription = row.setupScriptDescription;
    scriptRows.push(newRow);
  }

  // Get rid of duplicates.
  scriptRows = util.removeDuplicateAndBlankRows(scriptRows);

  // Sort rows by script ascending
  scriptRows.sort((a, b) => {
    const valueA = a.setupScript;
    const valueB = b.setupScript;
    if (valueA < valueB) {
      return -1;
    }
    if (valueA > valueB) {
      return 1;
    }
    return 0;
  });

  // Write rows to CSV file
  const rowWriter = createCsvWriter({
    path: scriptsFile,
    header: Object.keys(scriptRows[0]).map(column => ({ id: column, title: column })),
  });
  await rowWriter.writeRecords(scriptRows);
  await util.logMessage(
    `Wrote ${scriptRows.length} script names and descriptions to ${path.basename(scriptsFile)}`
  );
}

async function makeReferencesCsvData(allInputCsvData) {
  await util.logMessage(`\nCreating ${path.basename(referencesFile)}.`);

  // pull data from the refId and value columns of the v1references aray.
  let refRows = [];
  for (const row of allInputCsvData.v1references) {
    // properties in the row objects match columns in the input file:
    // refId, value
    let newRow = {};
    newRow.refId = row.refId;
    if (row.refId.trim().search(/^author$/i) >= 0) {
      newRow.type = 'metadata';
      newRow.value = row.value;
      newRow.linkText = '';
    } else if (row.refId.trim().search(/^authorEmail$/i) >= 0) {
      newRow.type = 'metadata';
      newRow.value = row.value;
      newRow.linkText = '';
    } else if (row.refId.trim().search(/^title$/i) >= 0) {
      newRow.type = 'metadata';
      newRow.value = row.value;
      newRow.linkText = '';
    } else if (row.refId.trim().search(/^reference$/i) >= 0) {
      newRow.type = 'metadata';
      newRow.value = row.value;
      const planTitle = allInputCsvData.v1references.find(
        row => row.refId.trim().search(/^title$/i) >= 0
      ).value;
      newRow.linkText = `Test Case Page for ${planTitle}`;
    } else if (row.refId.trim().search(/^example$/i) >= 0) {
      newRow.type = 'metadata';
      newRow.value = row.value;
      newRow.linkText = '';
      // See if we can update value and link text to represent new APG
      if (row.value.toLowerCase().includes('github')) {
        let newValue = 'New URL is Required';
        const indexOfDotIo = row.value.toLowerCase().indexOf('.io');
        if (indexOfDotIo >= 0) {
          const oldUrlPath = row.value.substring(indexOfDotIo + 3);
          newRow.value = v2json.oldToNewAPGExamples[oldUrlPath];
          const indexOfSlashApg = newRow.value.indexOf('/apg');
          if (indexOfSlashApg >= 0) {
            const newUrlPath = newRow.value.substring(indexOfSlashApg + 4);
            newRow.linkText = `APG Example: ${v2json.apgExamples[newUrlPath]}`;
          }
        }
      }
    } else if (row.refId.trim().search(/^designPattern$/i) >= 0) {
      newRow.type = 'metadata';
      newRow.value = row.value;
      newRow.linkText = 'APG Design Pattern';
      // See if we can update value and link text to represent new APG
      if (row.value.toLowerCase().includes('github')) {
        let newValue = 'New URL is Required';
        const indexOfHash = row.value.toLowerCase().indexOf('#');
        if (indexOfHash >= 0) {
          const oldUrlPath = row.value.substring(indexOfHash);
          newRow.value = v2json.oldToNewAPGPatterns[oldUrlPath];
          const indexOfSlashApg = newRow.value.indexOf('/apg');
          if (indexOfSlashApg >= 0) {
            const newUrlPath = newRow.value.substring(indexOfSlashApg + 4);
            newRow.linkText = v2json.apgPatterns[newUrlPath];
          }
        }
      }
    } else if (row.refId.trim().search(/^developmentDocumentation$/i) >= 0) {
      newRow.type = 'metadata';
      newRow.value = row.value;
      newRow.linkText = `Development Documentation for ${row.title} Test Plan`;
    } else {
      newRow.type = 'aria';
      newRow.value = row.refId;
      newRow.linkText = row.refId;
    }
    refRows.push(newRow);
  }

  // Write rows to CSV file
  const rowWriter = createCsvWriter({
    path: referencesFile,
    header: Object.keys(refRows[0]).map(column => ({ id: column, title: column })),
  });
  await rowWriter.writeRecords(refRows);
  await util.logMessage(`Wrote ${refRows.length} references to ${path.basename(referencesFile)}`);
}
