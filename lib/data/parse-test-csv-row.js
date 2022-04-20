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

exports.parseTestCSVRow = parseTestCSVRow;
