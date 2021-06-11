/** @deprecated See aria-at-test-io.mjs */

import * as keys from './keys.mjs';

/**
 * Class for getting AT-specific instructions for a test against a design pattern.
 * @deprecated See aria-at-test-io.mjs:CommandsInput
 */
export class commandsAPI {
  /**
   * Creates an API to get AT-specific instructions for a design pattern.
   * @param {object} commands - A data structure which is a nested object with the following format:
   *   {
   *     task: {
   *       mode: {
   *         at: [
   *           key-command (string corresponding to export in keys.mjs),
   *           optional additional instructions to list after key command (string),
   *         ]
   *       }
   *     }
   *   }
   */
constructor(commands, support) {
    if (!commands) {
      throw new Error("You must initialize commandsAPI with a commands data object");
    }

    if (!support) {
      throw new Error("You must initialize commandsAPI with a support data object");
    }

    this.AT_COMMAND_MAP = commands;

    this.MODE_INSTRUCTIONS = {
      reading: {
        jaws: `Verify the Virtual Cursor is active by pressing ${keys.ALT_DELETE}. If it is not, turn on the Virtual Cursor by pressing ${keys.INS_Z}.`,
        nvda: `Insure NVDA is in browse mode by pressing ${keys.ESC}. Note: This command has no effect if NVDA is already in browse mode.`,
        voiceover_macos: `Toggle Quick Nav ON by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`
      },
      interaction: {
        jaws: `Verify the PC Cursor is active by pressing ${keys.ALT_DELETE}. If it is not, turn off the Virtual Cursor by pressing ${keys.INS_Z}.`,
        nvda: `If NVDA did not make the focus mode sound when the test page loaded, press ${keys.INS_SPACE} to turn focus mode on.`,
        voiceover_macos: `Toggle Quick Nav OFF by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`
      }
    };

    this.support = support;
  }


  /**
   * Get AT-specific instruction
   * @param {string} mode - The mode of the screen reader, "reading" or "interaction"
   * @param {string} task - The task of the test.
   * @param {string} assitiveTech - The assistive technology.
   * @return {Array} - A list of commands (strings)
   */
  getATCommands(mode, task, assistiveTech) {
    if (!this.AT_COMMAND_MAP[task]) {
      throw new Error(`Task "${task}" does not exist, please add to at-commands or correct your spelling.`);
    }
    else if (!this.AT_COMMAND_MAP[task][mode]) {
      throw new Error(`Mode "${mode}" instructions for task "${task}" does not exist, please add to at-commands or correct your spelling.`);
    }

    let commandsData = this.AT_COMMAND_MAP[task][mode][assistiveTech.key] || [];
    let commands = [];

    for (let c of commandsData) {
      let innerCommands = [];
      let commandSequence = c[0].split(',');
      for (let command of commandSequence) {
        command = keys[command];
        if (typeof command === 'undefined') {
          throw new Error(`Key instruction identifier "${c}" for AT "${assistiveTech.name}", mode "${mode}", task "${task}" is not an available identified. Update you commands.json file to the correct identifier or add your identifier to resources/keys.mjs.`);
        }

        let furtherInstruction = c[1];
        command = furtherInstruction ? `${command} ${furtherInstruction}` : command;
        innerCommands.push(command);
      }
      commands.push(innerCommands.join(", then "));
    }

    return commands;
  }

  /**
   * Get AT-specific mode switching instructions
   * @param {string} mode - The mode of the screen reader, "reading" or "interaction"
   * @param {string} assistiveTech - The assistive technology.
   * @return {string} - Instructions for switching into the correct mode.
   */
  getModeInstructions(mode, assistiveTech) {
    if (this.MODE_INSTRUCTIONS[mode] && this.MODE_INSTRUCTIONS[mode][assistiveTech.key]) {
      return this.MODE_INSTRUCTIONS[mode][assistiveTech.key];
    }
    return '';
  }

  /**
   * Get AT-specific instruction
   * @param {string} at - an assitve technology with any capitalization
   * @return {string} - if this API knows instructions for `at`, it will return the `at` with proper capitalization
   */
  isKnownAT(at) {
    return this.support.ats.find(o => o.key === at.toLowerCase());
  }
}
