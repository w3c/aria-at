import * as keys from './keys.mjs';

/** Class for getting AT-specific instructions for a test against a design pattern. */
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
constructor(commands) {
    if (!commands) {
      throw new Error("You must initialize commandsAPI with a commands data object");
    }

    this.AT_COMMAND_MAP = commands;

    this.MODE_INSTRUCTIONS = {
      reading: {
        jaws: `Put JAWS into Virtual Cursor Mode using ${keys.INS_Z}`,
        nvda: `Put NVDA into Browse Mode using ${keys.ESC}`,
        voiceover: `Toggle Quick Nav ON by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`
      },
      interaction: {
        jaws: `Put JAWS into Forms Mode by turning Virtual Cursor off using ${keys.INS_Z}`,
        nvda: "Put NVDA into Focus Mode using NVDA+Space",
        voiceover: `Toggle Quick Nav OFF by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`
      }
    };

    this.KNOWN_ATS = {
      jaws: 'JAWS',
      nvda: 'NVDA',
      voiceover: 'VoiceOver'
    };
  }


  /**
   * Get AT-specific instruction
   * @param {string} mode - The mode of the screen reader, "reading" or "interaction"
   * @param {string} task - The task of the test.
   * @param {string} assitiveTech - The assistive technology.
   * @return {Array} - A list of commands (strings)
   */
  getATCommands(mode, task, assistiveTech) {
    const at = assistiveTech.toLowerCase();

    if (!this.AT_COMMAND_MAP[task]) {
      throw new Error(`Task "${task}" does not exist, please add to at-commands or correct your spelling.`);
    }
    else if (!this.AT_COMMAND_MAP[task][mode]) {
      throw new Error(`Mode "${mode}" instructions for task "${task}" does not exist, please add to at-commands or correct your spelling.`);
    }

    let commandsData = this.AT_COMMAND_MAP[task][mode][at] || [];
    let commands = [];

    for (let c of commandsData) {
      let command = keys[c[0]];
      if (typeof command === 'undefined') {
        throw new Error(`Key instruction identifier "${c}" for AT "${assistiveTech}", mode "${mode}", task "${task}" is not an available identified. Update you commands.json file to the correct identifier or add your identifier to resources/keys.mjs.`);
      }

      let furtherInstruction = c[1];
      command = furtherInstruction ? `${command} ${furtherInstruction}` : command;
      commands.push(command);
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
    const at = assistiveTech.toLowerCase();
    if (this.MODE_INSTRUCTIONS[mode] && this.MODE_INSTRUCTIONS[mode][at]) {
      return this.MODE_INSTRUCTIONS[mode][at];
    }
    return '';
  }

  /**
   * Get AT-specific instruction
   * @param {string} at - an assitve technology with any capitalization
   * @return {string} - if this API knows instructions for `at`, it will return the `at` with proper capitalization
   */
  isKnownAT(at) {
    return this.KNOWN_ATS[at.toLowerCase()];
  }
}
