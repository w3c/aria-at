/// <reference path="../../types/aria-at-validated.js" />
/// <reference path="../../types/aria-at-file.js" />

'use strict';

/**
 * Create command lookup object and file.
 * @param {AriaATValidated.Command[]} commands
 * @returns {AriaATFile.CommandTuplesATModeTaskLookup}
 */
function createCommandTuplesATModeTaskLookup(commands) {
  const data = commands.reduce((carry, command) => {
    const commandTask = carry[command.task] || {};
    const commandTaskMode = commandTask[command.target.mode] || {};
    const commandTaskModeAT = commandTaskMode[command.target.at.key] || [];
    const commandTuples = command.commands.map(({ id, extraInstruction }) =>
      extraInstruction ? [id, extraInstruction] : [id]
    );
    return {
      ...carry,
      [command.task]: {
        ...commandTask,
        [command.target.mode]: {
          ...commandTaskMode,
          [command.target.at.key]: [...commandTaskModeAT, ...commandTuples],
        },
      },
    };
  }, {});

  return data;
}

exports.createCommandTuplesATModeTaskLookup = createCommandTuplesATModeTaskLookup;
