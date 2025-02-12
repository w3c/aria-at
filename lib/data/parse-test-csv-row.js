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

/**
 * Utility function to check if @param object has any keys present
 * @param object
 * @returns {boolean}
 */
function isEmptyObject(object) {
  return object && Object.keys(object).length === 0;
}

function parseTestCSVRowV2({ tests, assertions, scripts, commands }) {
  const testsParsed = [];

  // Sort tests by presentationNumber; disregard the line position of the test in tests.csv
  tests.sort((a, b) => a.presentationNumber - b.presentationNumber);

  // Create containers for all potentially found presentationNumbers; empty ones will be filtered out at the end.
  // For eg. in the case where an {at-key}-commands.csv is missing.
  // This also maintains the order for testRow.presentationNumber
  for (let i = 0; i < tests.length; i++) {
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
          // TODO: Return error if foundAssertion is empty
          let foundAssertion = {};
          assertions.forEach(e => {
            if (assertion.includes(':')) {
              const [priority, assertionId] = assertion.split(':');
              if (e.assertionId === assertionId) {
                foundAssertion = {
                  ...e,
                  priority: Number(priority),
                };
              }
            } else if (e.assertionId === assertion) {
              foundAssertion = {
                ...e,
                priority: Number(e.priority),
              };
            }
          });
          return foundAssertion;
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
    const settings = command.settings || 'defaultMode';

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
              settings,
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
          e => e.key === atTargetInfo.key && e.settings === settings
        )
      )
        testsParsed[arrPosition].target.ats.push({
          ...atTargetInfo,
          settings,
        });
    }
  }

  const generateTestsParsed = (commands, key) => {
    for (const command of commands) {
      const findTest = test => test.testId === command.testId;

      const test = tests.find(findTest);
      const testIndex = tests.findIndex(findTest);
      createParsedTest(testIndex, test, command, { key });
    }
  };

  const attachCommandInfo = (commands, key) => {
    function findCommandInfo({ command, presentationNumber, settings, testId }, commandInfo) {
      return (
        testId === commandInfo.testId &&
        command === commandInfo.command &&
        settings === commandInfo.settings &&
        presentationNumber === commandInfo.presentationNumber
      );
    }

    for (const command of commands) {
      testsParsed.forEach(test => {
        const settings = command.settings || 'defaultMode';

        if (
          command.testId === test.testId &&
          test.target.ats.some(at => at.key === key && at.settings === settings)
        ) {
          const commandInfo = {
            testId: command.testId,
            command: command.command,
            settings: settings,
            presentationNumber: Number(command.presentationNumber),
            assertionExceptions: command.assertionExceptions,
          };

          // Test level commandInfo, useful for getting assertionExceptions and
          // sort order in review and test pages
          if (!test.commandsInfo) test.commandsInfo = {};
          if (!test.commandsInfo[key]) test.commandsInfo[key] = [];
          const testCommandInfoExists = test.commandsInfo[key].find(each =>
            findCommandInfo(each, commandInfo)
          );

          if (!testCommandInfoExists) test.commandsInfo[key].push(commandInfo);
        }
      });
    }
  };

  // Maintain the order of commands by commandRow.presentationNumber
  const commandsSort = (a, b) =>
    parseFloat(a.presentationNumber) - parseFloat(b.presentationNumber);

  /*const GENERATE_TESTS = [
    [jawsCommands, 'jaws'],
    [nvdaCommands, 'nvda'],
    [voCommands, 'voiceover_macos'],
  ];*/
  const GENERATE_TESTS = commands.map(command => [command.commands, command.atKey]);
  GENERATE_TESTS.forEach(([commands, key]) => {
    if (commands.length) generateTestsParsed(commands.sort(commandsSort), key);
  });
  GENERATE_TESTS.forEach(([commands, key]) => {
    if (commands.length) attachCommandInfo(commands.sort(commandsSort), key);
  });

  return testsParsed.filter(testParsed => Object.keys(testParsed).length);
}

module.exports = {
  parseTestCSVRow,
  parseTestCSVRowV2,
};
