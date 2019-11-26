import * as keys from './keys.mjs';

const KNOWN_ATS = {
  jaws: 'JAWS',
  nvda: 'NVDA',
  voiceover: 'VoiceOver'
}

/* Add new commands here */

const AT_COMMAND_MAP = {
  "navigate to combobox": {
    reading: {
      jaws: [
        ["", keys.C_AND_SHIFT_C],
        ["", keys.F_AND_SHIFT_F],
        ["", keys.UP_AND_DOWN],
	["", `${keys.LEFT_AND_RIGHT} (with Smart Navigation set to Controls and Tables)`]
      ]
    },
    interaction: {
      jaws: [
        ["", keys.TAB_AND_SHIFT_TAB],
      ]
    }
  },
  "read combobox": {
    reading: {
      jaws: [
        ["", keys.INSERT_TAB],
        ["", keys.INSERT_UP],
      ]
    },
    interaction: {
      jaws: [
        ["", keys.INSERT_TAB],
        ["", keys.INSERT_UP],
      ]
    }
  },
  "navigate to combobox with keys that switch modes": {
    reading: {
      jaws: [
        ["", keys.TAB_AND_SHIFT_TAB],
      ]
    }
  },
  "activate combobox": {
    reading: {
      jaws: [
        ["", keys.ENTER],
      ]
    }
  },
  "open combobox from input": {
    interaction: {
      jaws: [
        ["", keys.DOWN],
        ["", keys.UP]
      ]
    }
  },
  "read checkbox": {
    reading: {
      jaws: [
        ["navigate to the checkbox using", keys.X_AND_SHIFT_X],
        ["navigate to the checkbox using", keys.TAB_AND_SHIFT_TAB],
        ["navigate to the checkbox using", keys.UP_AND_DOWN],
        ["navigate to the checkbox using", `${keys.LEFT_AND_RIGHT} (with Smart Navigation on)`],
        ["navigate to the checkbox using", `${keys.CTRL_INS_X} to see a list of checkboxes; then use the Up/Down arrows to select a checkbox; then press Enter to navigate to that checkbox`],
        ["when the cursor is on the checkbox, read it using", keys.INS_TAB_OR_CAPS_TAB],
        ["when the cursor is on the checkbox, read it using", keys.INS_UP_OR_CAPS_I]
      ],
      nvda: [
        ["navigate to the checkbox using", keys.X_AND_SHIFT_X],
        ["navigate to the checkbox using", keys.TAB_AND_SHIFT_TAB],
        ["navigate to the checkbox using", keys.UP_AND_DOWN],
        ["navigate to the checkbox using", keys.INS_DOWN_OR_CAPS_DOWN],
        ["navigate to the checkbox using", `${keys.INS_F7_OR_CAPS_F7} to access list of elements on the page; then select ‘type’ = ‘form fields’; then select a checkbox in the list of form controls; then press ‘Enter’ to navigate to that checkbox`],
        ["when the cursor is on the checkbox, read it using", keys.INS_TAB_OR_CAPS_TAB],
        ["when the cursor is on the checkbox, read it using", keys.INS_UP_OR_CAPS_UP]
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
        ["navigate to the checkbox using", keys.TAB_AND_SHIFT_TAB],
        ["when the cursor is on the checkbox, read it using", keys.INS_TAB_OR_CAPS_TAB],
        ["when the cursor is on the checkbox, read it using", keys.INS_UP_OR_CAPS_I]
      ],
      nvda: [
        ["navigate to the checkbox using", keys.TAB_AND_SHIFT_TAB],
        ["when the cursor is on the checkbox, read it using", keys.INS_TAB_OR_CAPS_TAB],
        ["when the cursor is on the checkbox, read it using", keys.INS_UP_OR_CAPS_UP]
      ],
      voiceover: [
        ["navigate to the checkbox using", keys.TAB_AND_SHIFT_TAB],
        ["navigate to the checkbox using", keys.CTRL_OPT_RIGHT_AND_CTRL_OPT_LEFT],
        ["navigate to the checkbox using", keys.CTRL_OPT_A],
        ["navigate to the checkbox using", keys.CTRL_OPT_CMD_J_AND_SHIFT_CTRL_OPT_CMD_J],
        ["navigate to the checkbox using", keys.CTRL_OPT_CMD_C_AND_SHIFT_CTRL_OPT_CMD_C],
        ["navigate to the checkbox using", `${keys.CTRL_U} to open the ‘Rotor’ menu; then press the Right arrow until the list of 'Form Controls’ appears; then select a checkbox in the list of form controls using the Up/Down arrow keys; then press ‘Enter’ to navigate to that checkbox`]
      ]
    }
  },
  "operate checkbox": {
    reading: {
      jaws: [
        ["when the cursor is on the checkbox, change the state using", keys.ENTER],
        ["when the cursor is on the checkbox, change the state using", keys.SPACE]
      ],
      nvda: [
        ["when the cursor is on the checkbox, change the state using", keys.ENTER],
        ["when the cursor is on the checkbox, change the state using", keys.SPACE]
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
        ["when the cursor is on the checkbox, change the state using", keys.SPACE]
      ],
      nvda: [
        ["when the cursor is on the checkbox, change the state using", keys.SPACE]
      ],
      voiceover: [
        ["when the cursor is on the checkbox, change the state using", keys.CTRL_OPT_SPACE],
        ["when the cursor is on the checkbox, change the state using", keys.SPACE]
      ]
    }
  },
  "navigate to checkbox group": {
    reading: {
      jaws: [
        ["navigate through group boundaries using", keys.UP_AND_DOWN],
        ["navigate through group boundaries using", keys.TAB_AND_SHIFT_TAB],
        ["navigate through group boundaries using", `${keys.CTRL_INS_X} to see a list of checkboxes; then use the Up/Down arrows to select a checkbox; then press Enter to navigate to that checkbox`],
        ["when the cursor is on a checkbox, read the group using", keys.INS_TAB_OR_CAPS_TAB],
        ["when the cursor is on a checkbox, read the group using", keys.INS_UP_OR_CAPS_I]
      ],
      nvda: [
        ["navigate through group boundaries using", keys.X_AND_SHIFT_X],
        ["navigate through group boundaries using", keys.UP_AND_DOWN],
        ["navigate through group boundaries using", keys.TAB_AND_SHIFT_TAB],
        ["navigate through group boundaries using", keys.INS_DOWN_OR_CAPS_DOWN],
        ["navigate through group boundaries using", `${keys.INS_F7_OR_CAPS_F7} to access list of elements on the page; then select ‘type’ = ‘form fields’; then select a checkbox in the list of form controls; then press ‘Enter’ to navigate to that checkbox`],
        ["when the cursor is on a checkbox, read the group using", keys.INS_TAB_OR_CAPS_TAB],
        ["when the cursor is on a checkbox, read the group using", keys.INS_UP_OR_CAPS_UP]
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
	["navigate through group boundaries using", keys.TAB_AND_SHIFT_TAB],
        ["when the cursor is on a checkbox, read the group using", keys.INS_TAB_OR_CAPS_TAB],
        ["when the cursor is on a checkbox, read the group using", keys.INS_UP_OR_CAPS_I]
      ],
      nvda: [
        ["navigate through group boundaries using", keys.TAB_AND_SHIFT_TAB],
        ["when the cursor is on a checkbox, read the group using", keys.INS_TAB_OR_CAPS_TAB],
        ["when the cursor is on a checkbox, read the group using", keys.INS_UP_OR_CAPS_UP]
      ],
      voiceover: [
        ["navigate through group boundaries using", keys.TAB_AND_SHIFT_TAB],
        ["navigate through group boundaries using", keys.CTRL_OPT_RIGHT_AND_CTRL_OPT_LEFT],
        ["navigate through group boundaries using", keys.CTRL_OPT_A],
        ["navigate through group boundaries using", keys.CTRL_OPT_CMD_J_AND_SHIFT_CTRL_OPT_CMD_J],
        ["navigate through group boundaries using", keys.CTRL_OPT_CMD_C_AND_SHIFT_CTRL_OPT_CMD_C],
        ["navigate through group boundaries using", `${keys.CTRL_U} to open the ‘Rotor’ menu; then press the Right arrow until the list of 'Form Controls’ appears; then select a checkbox in the list of form controls using the Up/Down arrow keys; then press ‘Enter’ to navigate to that checkbox`]
      ]
    }
  }
};

const MODE_INSTRUCTIONS = {
  reading: {
    jaws: `Put JAWS into Virtual Cursor Mode using ${keys.INS_Z}`,
    nvda: `Put NVDA into Browser Mode using ${keys.ESC}`,
    voiceover: ""
  },
  interaction: {
    jaws: `Put JAWS into Forms Mode by turning Virual Cursor off using ${keys.INS_Z}`,
    nvda: "Put NVDA into Focus Mode using NVDA+Space",
    voiceover: `Turn Quick Nav off by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`
  }
};

export function getATCommands(mode, task, assistiveTech) {
  const at = assistiveTech.toLowerCase();

  if (!AT_COMMAND_MAP[task]) {
    throw new Error(`Task "${task}" does not exist, please add to at-commands or correct your spelling.`);
  }
  else if (!AT_COMMAND_MAP[task][mode]) {
    throw new Error(`Mode "${mode}" instructions for task "${task}" does not exist, please add to at-commands or correct your spelling.`);
  }

  return AT_COMMAND_MAP[task][mode][at] || [];
}

export function getModeInstructions(mode, assistiveTech) {
  const at = assistiveTech.toLowerCase();
  if (MODE_INSTRUCTIONS[mode] && MODE_INSTRUCTIONS[mode][at]) {
    return MODE_INSTRUCTIONS[mode][at];
  }
  return '';
}

export function isKnownAT(at) {
  return KNOWN_ATS[at.toLowerCase()];
}

export function getAdditionalAssertions(atAdditionalAssertions, key, mode, assistiveTech) {
  const at = assistiveTech.toLowerCase();

  let assertions = [];
  if (atAdditionalAssertions[at]) {
    for (let assertion of atAdditionalAssertions[at]) {
      if (assertion.keys.includes(key) && assertion.mode === mode) {
	assertions.push(assertion.assertion);
      }
    }
  }
  return assertions;
}
