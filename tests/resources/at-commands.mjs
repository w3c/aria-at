/** @deprecated See aria-at-test-io-format.mjs */

import * as keys from './keys.mjs';

/**
 * Class for getting AT-specific instructions for a test against a design pattern.
 * @deprecated See aria-at-test-io-format.mjs:CommandsInput
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
  constructor(commands, support, allCommands) {
    if (!commands) {
      throw new Error('You must initialize commandsAPI with a commands data object');
    }

    if (!support) {
      throw new Error('You must initialize commandsAPI with a support data object');
    }

    if (!allCommands) {
      throw new Error('You must initialize commandsAPI with an allCommands data object');
    }

    this.AT_COMMAND_MAP = commands;

    this.MODE_INSTRUCTIONS = {
      reading: {
        jaws: `Verify the Virtual Cursor is active by pressing ${keys.ALT_DELETE}. If it is not, exit Forms Mode to activate the Virtual Cursor by pressing ${keys.ESC}.`,
        nvda: `Ensure NVDA is in browse mode by pressing ${keys.ESC}. Note: This command has no effect if NVDA is already in browse mode.`,
        voiceover_macos: `Toggle Quick Nav ON by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`,
      },
      interaction: {
        jaws: `Verify the PC Cursor is active by pressing ${keys.ALT_DELETE}. If it is not, turn off the Virtual Cursor by pressing ${keys.INS_Z}.`,
        nvda: `If NVDA did not make the focus mode sound when the test page loaded, press ${keys.INS_SPACE} to turn focus mode on.`,
        voiceover_macos: `Toggle Quick Nav OFF by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`,
      },
    };

    this.support = support;
    this.allCommands = this.flattenObject(allCommands);
  }

  /**
   * Get AT-specific instruction
   * @param {string} mode - The mode of the screen reader, "reading" or "interaction"
   * @param {string} task - The task of the test.
   * @param {string} assistiveTech - The assistive technology.
   * @return {Array} - A list of commands (strings)
   */
  getATCommands(mode, task, assistiveTech) {
    if (!this.AT_COMMAND_MAP[task]) {
      throw new Error(
        `Task "${task}" does not exist, please add to at-commands or correct your spelling.`
      );
    }

    if (mode.includes('_')) {
      const atModes = mode.split('_');
      for (const _atMode of atModes) {
        if (this.AT_COMMAND_MAP[task][_atMode][assistiveTech.key]) {
          mode = _atMode;
        }
      }
    }

    if (!this.AT_COMMAND_MAP[task][mode]) {
      throw new Error(
        `Mode "${mode}" instructions for task "${task}" does not exist, please add to at-commands or correct your spelling.`
      );
    }

    let commandsData = this.AT_COMMAND_MAP[task][mode][assistiveTech.key] || [];
    let commands = [];

    // V1
    if (mode === 'reading' || mode === 'interaction') {
      for (let c of commandsData) {
        let innerCommands = [];
        let commandSequence = c[0].split(',');
        for (let command of commandSequence) {
          command = keys[command];
          if (typeof command === 'undefined') {
            throw new Error(
                `Key instruction identifier "${c}" for AT "${assistiveTech.name}", mode "${mode}", task "${task}" is not an available identifier. Update your commands.json file to the correct identifier or add your identifier to resources/keys.mjs.`
            );
          }

          let furtherInstruction = c[1];
          command = furtherInstruction ? `${command} ${furtherInstruction}` : command;
          innerCommands.push(command);
        }
        commands.push(innerCommands.join(', then '));
      }
    }

    // V2
    if (!commands.length) {
      for (let c of commandsData) {
        const commandKVs = this.findValuesByKeys(c)
        if (!commandKVs.length) {
          throw new Error(
              `Key instruction identifier "${c}" for AT "${assistiveTech.name}", mode "${mode}", task "${task}" is not an available identifier. Update your commands.json file to the correct identifier or add your identifier to tests/commands.json.`
          );
        }

        commands.push(...commandKVs);
      }
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

  defaultConfigurationInstructions(at) {
    return this.support.ats.find(o => o.key === at.toLowerCase()).defaultConfigurationInstructionsHTML;
  }

  flattenObject(obj, parentKey) {
    const flattened = {};

    for (const key in obj) {
      if (typeof obj[key] === 'object') {
        const subObject = this.flattenObject(obj[key], parentKey + key + '.');
        Object.assign(flattened, subObject);
      } else {
        flattened[parentKey + key] = obj[key];
      }
    }

    return flattened;
  }

  findValueByKey(keyToFind) {
    const keys = Object.keys(this.allCommands);

    // Need to specially handle VO modifier key combination
    if (keyToFind === 'vo')
      return this.findValuesByKeys([this.allCommands['modifierAliases.vo']])[0];

    if (keyToFind.includes('modifiers.') || keyToFind.includes('keys.')) {
      const parts = keyToFind.split('.');
      const keyToCheck = parts[parts.length - 1]; // value after the '.'

      if (this.allCommands[keyToFind])
        return {
          value: this.allCommands[keyToFind],
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
          return this.findValueByKey(`modifiers.${this.allCommands[key]}`);
        } else if (parentKey === 'keyAliases') {
          return this.findValueByKey(`keys.${this.allCommands[key]}`);
        }

        return {
          value: this.allCommands[key],
          key: keyToCheck,
        };
      }
    }

    // Return null if the key is not found
    return null;
  }

  findValuesByKeys(keysToFind = []) {
    const result = [];

    const patternSepWithReplacement = (keyToFind, pattern, replacement) => {
      if (keyToFind.includes(pattern)) {
        let value = '';
        let validKeys = true;
        const keys = keyToFind.split(pattern);

        for (const key of keys) {
          const keyResult = this.findValueByKey(key);
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
          const keyToFindResult = this.findValueByKey(key);
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
        const keyToFindResult = this.findValueByKey(keyToFind);
        if (keyToFindResult) result.push(keyToFindResult);
      }
    }

    return result;
  }
}
