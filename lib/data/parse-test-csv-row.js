/// <reference path="../../types/aria-at-csv.js" />
/// <reference path="../../types/aria-at-parsed.js" />

'use strict';

/**
 * @param {AriaATCSV.Test} testRow
 * @returns {AriaATParsed.Test}
 */
function parseTestCSVRow(testRow) {
  return {
    testId: Number(testRow.testId),
    task: testRow.task.replace(/[';]/g, '').trim().toLowerCase(),
    title: testRow.title,
    references: testRow.refs
      .split(' ')
      .map(raw => raw.trim().toLowerCase())
      .filter(Boolean)
      .map(refId => ({ refId })),
    target: {
      at: testRow.appliesTo.split(',').map(raw => ({
        key: raw.trim().toLowerCase().replace(' ', '_'),
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
      user: testRow.instructions.split('|').map(instruction => instruction.trim()),
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
      .map(assertion => {
        const colonMatch = /^([12]):/.exec(assertion);
        if (colonMatch) {
          const priority = Number(colonMatch[1]);
          return {
            priority: Number.isNaN(priority) ? colonMatch[1] : priority,
            expectation: assertion.substring(assertion.indexOf(':') + 1).trim(),
          };
        }
        return {
          priority: 1,
          expectation: assertion.trim(),
        };
      }),
  };
}

function findLargestCommandPresentationNumber(data) {
  let largestPresentationNumber = 0;

  for (const item of data) {
    const presentationNumber = parseFloat(item.presentationNumber);
    if (
      !isNaN(presentationNumber) &&
      presentationNumber > largestPresentationNumber &&
      presentationNumber % 1 === 0
    ) {
      // Check if it's a valid number and larger than the current largest whole number
      largestPresentationNumber = presentationNumber;
    }
  }

  return largestPresentationNumber;
}

function isEmptyObject(object) {
  return object && Object.keys(object).length === 0;
}

function parseTestCSVRowV2({ tests, assertions, scripts, commands }) {
  const testsParsed = [];
  const allCommands = [];
  commands.forEach(command => {
    allCommands.push(...command.commands);
  });

  const largestPresentationNumber = findLargestCommandPresentationNumber(allCommands);

  for (let i = 0; i < largestPresentationNumber; i++) {
    testsParsed.push({});
  }

  function createParsedTest(arrPosition, test, command, atTargetInfo) {
    // Create setupScript object
    const setupScript = test.setupScript
      ? scripts.find(script => test.setupScript === script.setupScript) // { setupScript, setupScriptDescription }
      : undefined;

    // Create assertions value
    const assertionsValue = test.assertions
      ? test.assertions.split(' ').map(assertion => {
          // TODO: Return error if foundAssertion undefined
          const foundAssertion = assertions.find(e => e.assertionId === assertion);
          return foundAssertion
            ? { ...foundAssertion, priority: Number(foundAssertion.priority) }
            : {};
        })
      : undefined;

    // Create references values
    let referencesValue = assertionsValue
      ? assertionsValue.flatMap(assertion => assertion.refIds.trim().split(' '))
      : [];
    referencesValue = referencesValue.filter(e => e !== '');

    if (referencesValue.length) {
      // Remove duplicates
      referencesValue = [...new Set(referencesValue)];

      // Format to [ { refId: '' } ]
      referencesValue = referencesValue.map(refId => {
        return { refId };
      });
    }

    // Also account for 'modeless' AT configurations with 'defaultMode'
    // TODO: Account for a list of settings as described by https://github.com/w3c/aria-at/wiki/Test-Format-Definition-V2#settings
    const settingsValue = command.settings || 'defaultMode';

    if (isEmptyObject(testsParsed[arrPosition])) {
      testsParsed[arrPosition] = {
        testId: test.testId,
        title: test.title,
        references: referencesValue,
        presentationNumber: Number(test.presentationNumber),
        target: {
          ats: [
            {
              ...atTargetInfo,
              settings: settingsValue,
            },
          ],
        },
        setupScript: setupScript
          ? {
              script: setupScript.setupScript,
              scriptDescription: setupScript.setupScriptDescription,
            }
          : setupScript,
        instructions: test.instructions,
        assertions: assertionsValue,
      };
    } else {
      if (
        !testsParsed[arrPosition].target.ats.find(
          e => e.key === atTargetInfo.key && e.settings === settingsValue
        )
      )
        testsParsed[arrPosition].target.ats.push({
          ...atTargetInfo,
          settings: settingsValue,
        });
    }
  }

  const generateTestsParsed = (commands, key) => {
    for (const command of commands) {
      const arrPosition = parseInt(command.presentationNumber) - 1;
      const test = tests.find(test => test.testId === command.testId);
      createParsedTest(arrPosition, test, command, { key });
    }
  };

  const attachCommandInfo = (commands, key) => {
    for (const command of commands) {
      testsParsed.forEach(test => {
        if (!test.commandsInfo) test.commandsInfo = {};
        if (!test.commandsInfo[key]) test.commandsInfo[key] = [];

        test.assertions.forEach(assertion => {
          if (
            command.testId === test.testId &&
            test.target.ats.some(
              at => at.key === key && at.settings === (command.settings || 'defaultMode')
            )
          ) {
            if (!assertion.commandInfo) assertion.commandInfo = {};
            if (!assertion.commandInfo[key]) assertion.commandInfo[key] = [];

            const commandInfo = {
              testId: command.testId,
              command: command.command,
              settings: command.settings || 'defaultMode',
              presentationNumber: Number(command.presentationNumber),
            };

            // assertion level commandInfo, useful for getting assertionExceptions
            const assertionCommandInfo = {
              ...commandInfo,
              assertionExceptions: command.assertionExceptions,
            };
            assertion.commandInfo[key].push(assertionCommandInfo);

            // test level commandInfo, useful for getting review level information
            const testCommandInfoExist = test.commandsInfo[key].find(
              ({ command, presentationNumber, settings, testId }) => {
                return (
                  testId === commandInfo.testId &&
                  command === commandInfo.command &&
                  settings === commandInfo.settings &&
                  presentationNumber === commandInfo.presentationNumber
                );
              }
            );
            if (!testCommandInfoExist) test.commandsInfo[key].push(commandInfo);
          }
        });
      });
    }
  };

  /*const GENERATE_TESTS = [
    [jawsCommands, 'jaws'],
    [nvdaCommands, 'nvda'],
    [voCommands, 'voiceover_macos'],
  ];*/
  const GENERATE_TESTS = commands.map(command => [command.commands, command.atKey]);
  GENERATE_TESTS.forEach(([commands, key]) => {
    if (commands.length) generateTestsParsed(commands, key);
  });
  GENERATE_TESTS.forEach(([commands, key]) => {
    if (commands.length) attachCommandInfo(commands, key);
  });

  return testsParsed.filter(testParsed => Object.keys(testParsed).length);
}

module.exports = {
  parseTestCSVRow,
  parseTestCSVRowV2,
};
