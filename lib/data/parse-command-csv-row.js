/// <reference path="../../types/aria-at-csv.js" />
/// <reference path="../../types/aria-at-parsed.js" />

'use strict';

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
      commandRow.commandG,
      commandRow.commandH,
      commandRow.commandI,
      commandRow.commandJ,
      commandRow.commandK,
      commandRow.commandL,
      commandRow.commandM,
      commandRow.commandN,
      commandRow.commandO,
      commandRow.commandP,
      commandRow.commandQ,
      commandRow.commandR,
      commandRow.commandS,
      commandRow.commandT,
      commandRow.commandU,
      commandRow.commandV,
      commandRow.commandW,
      commandRow.commandX,
      commandRow.commandY,
      commandRow.commandZ,
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
      })
      .map(({ id, ...rest }) => ({
        id,
        keypresses: id.split(',').map(id => ({ id })),
        ...rest,
      })),
  };
}

function parseCommandCSVRowV2({ commands }, commandsJson) {
  const commandsParsed = [];
  const flattenedCommandsJson = flattenObject(commandsJson);

  function createParsedCommand(command, atTargetInfo) {
    const commandIds = command.command.split(' ');
    const commandKVs = findValuesByKeys(flattenedCommandsJson, [command.command]);

    // Also account for 'modeless' AT configurations with 'defaultMode'
    const settings = command.settings || 'defaultMode';

    const foundCommandIndex = commandsParsed.findIndex(
      e =>
        e.testId === command.testId &&
        e.target.at.key === atTargetInfo.key &&
        e.target.at.settings === settings &&
        (e.commands.length
          ? e.commands.every(
              ({ presentationNumber }) =>
                parseInt(presentationNumber) === parseInt(command.presentationNumber)
            )
          : true)
    );

    const assertionExceptions = command.assertionExceptions.length
      ? sanitizeWhitespace(command.assertionExceptions).split(' ')
      : [];

    const commands = commandKVs.map(e => ({
      id: e.key,
      keystroke: e.value,
      keypresses: e.value.split(' then ').map((e, index) => ({
        id: commandIds[index],
        keystroke: e,
      })),
      presentationNumber: Number(command.presentationNumber),
      assertionExceptions,
    }));

    // Add new parsed command since none exist
    if (foundCommandIndex < 0) {
      commandsParsed.push({
        testId: command.testId,
        target: {
          at: {
            ...atTargetInfo,
            settings,
          },
        },
        commands,
      });
    } else {
      commandsParsed[foundCommandIndex].commands.push(...commands);
    }
  }

  const generateCommandsParsed = (commands, key) => {
    for (const command of commands) createParsedCommand(command, { key });
  };

  commands.forEach(command =>
    generateCommandsParsed(command.commands.map(sanitizeCommand), command.atKey)
  );

  return commandsParsed;
}

// Utils

function sanitizeWhitespace(value) {
  return value.replace(/\s+/g, ' ').trim();
}

function sanitizeCommand(command) {
  return {
    ...command,
    command: sanitizeWhitespace(command.command),
  };
}

/**
 * @param {object} obj
 * @param {string} parentKey
 * @returns {object}
 */
function flattenObject(obj, parentKey = '') {
  const flattened = {};

  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const subObject = flattenObject(obj[key], parentKey + key + '.');
      Object.assign(flattened, subObject);
    } else {
      flattened[parentKey + key] = obj[key];
    }
  }

  return flattened;
}

/**
 * @param {object} keysMapping
 * @param {string[]} keysToFind
 * @returns {Object<value: string, key: string>}[]}
 */
function findValuesByKeys(keysMapping, keysToFind = []) {
  const result = [];

  const patternSepWithReplacement = (keyToFind, pattern, replacement) => {
    if (keyToFind.includes(pattern)) {
      let value = '';
      let validKeys = true;
      const keys = keyToFind.split(pattern);

      for (const key of keys) {
        const keyResult = findValueByKey(keysMapping, key);
        if (keyResult) value = value ? `${value}${replacement}${keyResult.value}` : keyResult.value;
        else validKeys = false;
      }
      if (validKeys) return { value, key: keyToFind };
    }

    return null;
  };

  const patternSepHandler = keyToFind => {
    let value = '';

    if (keyToFind.includes(' ') && keyToFind.includes('+')) {
      const keys = keyToFind.split(' ');
      for (let [index, key] of keys.entries()) {
        const keyToFindResult = findValueByKey(keysMapping, key);
        if (keyToFindResult) keys[index] = keyToFindResult.value;
        if (key.includes('+')) keys[index] = patternSepWithReplacement(key, '+', '+').value;
      }
      value = keys.join(' then ');

      return { value, key: keyToFind };
    } else if (keyToFind.includes(' ')) return patternSepWithReplacement(keyToFind, ' ', ' then ');
    else if (keyToFind.includes('+')) return patternSepWithReplacement(keyToFind, '+', '+');
  };

  for (const keyToFind of keysToFind) {
    if (keyToFind.includes(' ') || keyToFind.includes('+')) {
      result.push(patternSepHandler(keyToFind));
    } else {
      const keyToFindResult = findValueByKey(keysMapping, keyToFind);
      if (keyToFindResult) result.push(keyToFindResult);
    }
  }

  return result;
}

/**
 * @param {object} keysMapping
 * @param {string} keyToFindText
 * @returns {Object<value: string, key: string>} | null}
 */
function findValueByKey(keysMapping, keyToFindText) {
  const keyToFind = keyToFindText.replace(/\s+/g, ' ').trim();
  const keys = Object.keys(keysMapping);

  // Need to specially handle VO modifier key combination
  if (keyToFind === 'vo')
    return findValuesByKeys(keysMapping, [keysMapping['modifierAliases.vo']])[0];

  if (keyToFind.includes('modifiers.') || keyToFind.includes('keys.')) {
    const parts = keyToFind.split('.');
    const keyToCheck = parts[parts.length - 1]; // value after the '.'

    if (keysMapping[keyToFind])
      return {
        value: keysMapping[keyToFind],
        key: keyToCheck,
      };

    return null;
  }

  for (const key of keys) {
    const parts = key.split('.');
    const parentKey = parts[0];
    const keyToCheck = parts[parts.length - 1]; // value after the '.'

    if (keyToCheck === keyToFind) {
      if (parentKey === 'modifierAliases') {
        return findValueByKey(keysMapping, `modifiers.${keysMapping[key]}`);
      } else if (parentKey === 'keyAliases') {
        return findValueByKey(keysMapping, `keys.${keysMapping[key]}`);
      }

      return {
        value: keysMapping[key],
        key: keyToCheck,
      };
    }
  }

  // Return null if the key is not found
  return null;
}

module.exports = {
  parseCommandCSVRow,
  parseCommandCSVRowV2,
  flattenObject,
};
