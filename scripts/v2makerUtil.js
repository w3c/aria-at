const fs = require('fs');
let logFile = null;
const validLogBehaviors = ['none', 'console', 'file', 'both'];
let logBehavior = 'both';

const escapeRegExp = string => {
  return string.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // Escape special characters
};

async function deleteFile(filePath) {
  if (fs.existsSync(filePath)) {
    await fs.unlinkSync(filePath);
  }
}

async function startLoggingTo(name, behavior) {
  if (behavior === undefined) logBehavior = 'both';
  if (validLogBehaviors.includes(behavior)) logBehavior = behavior;
  else
    throw new Error(
      `'${behavior}' is not a valid log behavior. Valid behaviors are ${validLogBehaviors}`
    );
  if (name === undefined) logFile = './log.txt';
  else logFile = name;
  if (logBehavior !== 'none') {
    if (logBehavior === 'file' || logBehavior === 'both') await deleteFile(logFile);
    const timestamp = new Date().toISOString();
    await logMessage(`Starting format conversion at ${timestamp}`);
  }
}

async function logMessage(message) {
  if (logBehavior === 'console' || logBehavior === 'both') console.log(message);
  if (logBehavior === 'file' || logBehavior === 'both') {
    const logEntry = `${message}\n`;
    await fs.appendFile(logFile, logEntry, err => {
      if (err) {
        throw new Error(`Error writing to ${logFilePath}: ${err}`);
      }
    });
  }
}

function setLogBehavior(behavior) {
  if (validLogBehaviors.includes(behavior)) logBehavior = behavior;
  else
    throw new Error(
      `'${behavior}' is not a valid log behavior. Valid behaviors are ${validLogBehaviors}`
    );
}

function getSubstitutionsAndDeletions(
  substitutionsFileDescriptor,
  csvData,
  searchStringsColName,
  replacementStringsColName
) {
  const substitutionsCsvData = csvData[substitutionsFileDescriptor];
  const substitutions = new Map();
  const deletions = new Set();

  let headersChecked = false;
  for (const row of substitutionsCsvData) {
    if (!headersChecked) {
      if (!(searchStringsColName in row) || !(replacementStringsColName in row)) {
        throw new Error(
          `Columns '${searchStringsColName}' and '${replacementStringsColName}' do not exist in the CSV file for ${substitutionsFileDescriptor}.`
        );
      }
      headersChecked = true;
    }

    const oldWords = row[searchStringsColName] || '';
    const newWords = row[replacementStringsColName] || '';
    if (newWords.trim() === '') {
      deletions.add(oldWords);
    } else {
      substitutions.set(oldWords, newWords);
    }
  }
  return { deletions: deletions, substitutions: substitutions };
}

function makeId(id, substitutions, deletions) {
  // First step is to make substitutions specified in the substitutions file.

  // Make substitutions that replace multiple words
  substitutions.forEach((newWord, oldWords) => {
    if (oldWords.includes(' ')) {
      const regex = new RegExp(`\\b${escapeRegExp(oldWords)}\\b`, 'g');
      id = id.replace(regex, newWord);
    }
  });

  // Make substitutions that delete multiple words
  deletions.forEach(wordToDelete => {
    if (wordToDelete.includes(' ')) {
      const regex = new RegExp(`\\b${escapeRegExp(wordToDelete)}\\b`, 'g');
      id = id.replace(regex, '');
    }
  });

  // Make substitutions that replace single words
  substitutions.forEach((newWord, oldWords) => {
    if (!oldWords.includes(' ')) {
      const regex = new RegExp(`\\b${escapeRegExp(oldWords)}\\b`, 'g');
      id = id.replace(regex, newWord);
    }
  });

  // Make substitutions that delete single words
  deletions.forEach(wordToDelete => {
    if (!wordToDelete.includes(' ')) {
      const regex = new RegExp(`\\b${escapeRegExp(wordToDelete)}\\b`, 'g');
      id = id.replace(regex, '');
    }
  });

  // step 2 is to Transform to single camel case word by upper casing first letters, removing spaces, and lowercasing start of string.
  id = id
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');
  id = id.charAt(0).toLowerCase() + id.slice(1);

  return id;
}

function translateCommand(screenReader, commandSequence, substitutions) {
  commandSequence = commandSequence.replaceAll(',', ' ').toLowerCase();
  let commandSettings = '';
  // Get substitutions for this screenReader
  substitutions = substitutions.filter(
    row => row.screenReader.toLowerCase().trim() === screenReader.toLowerCase().trim()
  );
  if (substitutions.length > 0) {
    const oldCommands = commandSequence.split(' ');
    let newCommandSequence = [];
    let newCommandSettings = [];
    for (const oldCommand of oldCommands) {
      let newCommand = oldCommand;
      for (const substitution of substitutions) {
        oldCommandRegex = new RegExp(`^${substitution.oldCommand}$`, 'i');
        if (oldCommand.match(oldCommandRegex)) {
          newCommand = oldCommand.replace(oldCommandRegex, substitution.newCommand);
          const newSetting = substitution.settings.trim();
          if (newSetting !== '' && !newCommandSettings.includes(newSetting))
            newCommandSettings.push(newSetting);
          break;
        }
      }
      newCommandSequence.push(newCommand);
    }
    commandSequence = newCommandSequence.join(' ');
    if (newCommandSettings.length > 0) commandSettings = newCommandSettings.join(' ');
  }
  commandSequence = commandSequence
    .replaceAll('_', '+')
    .replaceAll('one', '1')
    .replaceAll('two', '2')
    .trim();
  return { commandSequence, commandSettings };
}

function fixCase(input, isSentence) {
  let entireInputWrappedInSingleQuotes = false;
  let entireInputWrappedInDoubleQuotes = false;
  let charInsideSingleQuotes = false;
  let charInsideDoubleQuotes = false;
  let isStartOfFirstWord = true;

  const result = input.split('').map((char, index, arr) => {
    // If the entire string is quoted, ignore the leading and trailing quotes, i.e., continue to change case in the string.
    if (index === 0) {
      if (char === '"' && arr[arr.length - 1] === '"') {
        entireInputWrappedInDoubleQuotes = true;
        return char;
      }
      if (char === "'" && arr[arr.length - 1] === "'") {
        entireInputWrappedInSingleQuotes = true;
        return char;
      }
    }
    if (index === arr.length - 1) {
      if (entireInputWrappedInDoubleQuotes) return char;
      if (entireInputWrappedInSingleQuotes) return char;
    }
    // If the entire string is wrapped in double quotes, only pay attention to single quotes on the inside and vice versa.
    if (char === '"') {
      if (!entireInputWrappedInDoubleQuotes) charInsideDoubleQuotes = !charInsideDoubleQuotes;
      return char;
    }
    if (char === "'") {
      if (!entireInputWrappedInSingleQuotes) charInsideSingleQuotes = !charInsideSingleQuotes;
      return char;
    }
    // now process non-quote characters
    // Return any white space
    if (char.match(/\s/)) {
      isStartOfFirstWord = false;
      return char;
    }
    // Change case for any character not inside of quotes
    if (!charInsideSingleQuotes && !charInsideDoubleQuotes) {
      if (isStartOfFirstWord && isSentence) {
        isStartOfFirstWord = false;
        return char.toUpperCase();
      } else {
        isStartOfFirstWord = false;
        return char.toLowerCase();
      }
    } else {
      return char;
    }
  });

  return result.join('');
}

function sentenceCase(input) {
  return fixCase(input, true);
}

function phraseCase(input) {
  return fixCase(input, false);
}

function removeDuplicateAndBlankRows(rows) {
  // Find and remove rows where all values in all columns are equivalent.
  // Also remove blank rows.
  const uniqueNonBlankRows = [];
  const seenRows = new Set();
  for (const row of rows) {
    let blankCellCount = 0;
    const rowString = JSON.stringify(row);
    if (!seenRows.has(rowString)) {
      seenRows.add(rowString);
      for (const [key, value] of Object.entries(row)) {
        if (value.trim() === '') blankCellCount++;
        else break;
      }
      if (blankCellCount < Object.keys(row).length) {
        uniqueNonBlankRows.push(row);
      }
    }
  }
  return uniqueNonBlankRows;
}

function trimQuotes(input) {
  // Trim leading and/or trailing double quotes from a string
  if (input.length >= 2 && input.charAt(0) === '"') {
    input = input.slice(1);
  }
  if (input.length >= 1 && input.charAt(input.length - 1) === '"') {
    input = input.slice(0, -1);
  }
  return input;
}

module.exports = {
  deleteFile,
  startLoggingTo,
  logMessage,
  getSubstitutionsAndDeletions,
  makeId,
  translateCommand,
  phraseCase,
  sentenceCase,
  removeDuplicateAndBlankRows,
  trimQuotes,
};
