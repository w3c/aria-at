import * as keys from './keys.mjs';

export class commandsAPI {
  constructor(commands) {
    if (!commands) {
      throw new Error("You must initialize commandsAPI with a commands data object");
    }

    this.AT_COMMAND_MAP = commands;

    this.MODE_INSTRUCTIONS = {
      reading: {
	jaws: `Put JAWS into Virtual Cursor Mode using ${keys.INS_Z}`,
	nvda: `Put NVDA into Browser Mode using ${keys.ESC}`,
	voiceover: ""
      },
      interaction: {
	jaws: `Put JAWS into Forms Mode by turning Virtual Cursor off using ${keys.INS_Z}`,
	nvda: "Put NVDA into Focus Mode using NVDA+Space",
	voiceover: `Turn Quick Nav off by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`
      }
    };

    this.KNOWN_ATS = {
      jaws: 'JAWS',
      nvda: 'NVDA',
      voiceover: 'VoiceOver'
    };
  }

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

  getModeInstructions(mode, assistiveTech) {
    const at = assistiveTech.toLowerCase();
    if (this.MODE_INSTRUCTIONS[mode] && this.MODE_INSTRUCTIONS[mode][at]) {
      return this.MODE_INSTRUCTIONS[mode][at];
    }
    return '';
  }

  isKnownAT(at) {
    return this.KNOWN_ATS[at.toLowerCase()];
  }
}
