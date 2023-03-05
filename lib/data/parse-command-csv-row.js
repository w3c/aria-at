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

exports.parseCommandCSVRow = parseCommandCSVRow;
