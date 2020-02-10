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
        keys.C_AND_SHIFT_C,
        keys.F_AND_SHIFT_F,
        keys.UP_AND_DOWN,
        `${keys.LEFT_AND_RIGHT} (with Smart Navigation set to Controls and Tables)`
      ]
    },
    interaction: {
      jaws: [
        keys.TAB_AND_SHIFT_TAB
      ]
    }
  },
  "read combobox": {
    reading: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    },
    interaction: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    }
  },
  "navigate to item with keys that switch modes": {
    reading: {
      jaws: [
        keys.TAB_AND_SHIFT_TAB
      ]
    }
  },
  "navigate to combobox with keys that switch modes": {
    reading: {
      jaws: [
        keys.TAB_AND_SHIFT_TAB
      ]
    }
  },
  "activate item": {
    reading: {
      jaws: [
        keys.ENTER
      ]
    }
  },
  "activate combobox": {
    reading: {
      jaws: [
        keys.ENTER
      ]
    }
  },
  "open combobox from input": {
    interaction: {
      jaws: [
        keys.DOWN,
        keys.UP
      ]
    }
  },
  "navigate to checkbox": {
    reading: {
      jaws: [
        keys.X_AND_SHIFT_X,
        keys.TAB_AND_SHIFT_TAB,
        keys.UP_AND_DOWN,
        `${keys.LEFT_AND_RIGHT} (with Smart Navigation on)`,
        `${keys.CTRL_INS_X} to see a list of checkboxes; then use the Up/Down arrows to select a checkbox; then press Enter to navigate to that checkbox`
      ],
      nvda: [
        keys.X_AND_SHIFT_X,
        keys.TAB_AND_SHIFT_TAB,
        keys.UP_AND_DOWN,
        keys.INS_DOWN_OR_CAPS_DOWN,
        `${keys.INS_F7_OR_CAPS_F7} to access list of elements on the page; then select 'type' = 'form fields'; then select a checkbox in the list of form controls; then press 'Enter' to navigate to that checkbox`
      ],
      voiceover: []
    },
    interaction: {
      jaws: [
        keys.TAB_AND_SHIFT_TAB
      ],
      nvda: [
        keys.TAB_AND_SHIFT_TAB
      ],
      voiceover: [
        keys.TAB_AND_SHIFT_TAB,
        keys.CTRL_OPT_RIGHT_AND_CTRL_OPT_LEFT,
        keys.CTRL_OPT_A,
        keys.CTRL_OPT_CMD_J_AND_SHIFT_CTRL_OPT_CMD_J,
        keys.CTRL_OPT_CMD_C_AND_SHIFT_CTRL_OPT_CMD_C,
        `${keys.CTRL_U} to open the 'Rotor' menu; then press the Right arrow until the list of 'Form Controls' appears; then select a checkbox in the list of form controls using the Up/Down arrow keys; then press 'Enter' to navigate to that checkbox`
      ]
    }
  },
  "read checkbox": {
    reading: {
      jaws: [
        keys.INS_TAB_OR_CAPS_TAB,
        keys.INS_UP_OR_CAPS_I
      ],
      nvda: [
        keys.INS_TAB_OR_CAPS_TAB,
        keys.INS_UP_OR_CAPS_UP
      ],
      voiceover: []
    },
    interaction: {
      jaws: [
        keys.INS_TAB_OR_CAPS_TAB,
        keys.INS_UP_OR_CAPS_I
      ],
      nvda: [
        keys.INS_TAB_OR_CAPS_TAB,
        keys.INS_UP_OR_CAPS_UP
      ],
      voiceover: []
    }
  },
  "operate checkbox": {
    reading: {
      jaws: [
        keys.ENTER,
        keys.SPACE
      ],
      nvda: [
        keys.ENTER,
        keys.SPACE
      ],
      voiceover: []
    },
    interaction: {
      jaws: [
        keys.SPACE
      ],
      nvda: [
        keys.SPACE
      ],
      voiceover: [
        keys.CTRL_OPT_SPACE,
        keys.SPACE
      ]
    }
  },
  "navigate to checkbox group": {
    reading: {
      jaws: [
        keys.UP_AND_DOWN,
        keys.TAB_AND_SHIFT_TAB,
        `${keys.CTRL_INS_X} to see a list of checkboxes; then use the Up/Down arrows to select a checkbox; then press Enter to navigate to that checkbox`
      ],
      nvda: [
        keys.X_AND_SHIFT_X,
        keys.UP_AND_DOWN,
        keys.TAB_AND_SHIFT_TAB,
        keys.INS_DOWN_OR_CAPS_DOWN,
        `${keys.INS_F7_OR_CAPS_F7} to access list of elements on the page; then select 'type' = 'form fields'; then select a checkbox in the list of form controls; then press 'Enter' to navigate to that checkbox`
      ],
      voiceover: []
    },
    interaction: {
      jaws: [
        keys.TAB_AND_SHIFT_TAB
      ],
      nvda: [
        keys.TAB_AND_SHIFT_TAB
      ],
      voiceover: [
        keys.TAB_AND_SHIFT_TAB,
        keys.CTRL_OPT_RIGHT_AND_CTRL_OPT_LEFT,
        keys.CTRL_OPT_A,
        keys.CTRL_OPT_CMD_J_AND_SHIFT_CTRL_OPT_CMD_J,
        keys.CTRL_OPT_CMD_C_AND_SHIFT_CTRL_OPT_CMD_C,
        `${keys.CTRL_U} to open the 'Rotor' menu; then press the Right arrow until the list of 'Form Controls' appears; then select a checkbox in the list of form controls using the Up/Down arrow keys; then press 'Enter' to navigate to that checkbox`
      ]
    }
  },
  "read the checkbox group": {
    reading: {
      jaws: [
        keys.INS_TAB_OR_CAPS_TAB,
        keys.INS_UP_OR_CAPS_I
      ],
      nvda: [
        keys.INS_TAB_OR_CAPS_TAB,
        keys.INS_UP_OR_CAPS_UP
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
        keys.INS_TAB_OR_CAPS_TAB,
        keys.INS_UP_OR_CAPS_I
      ],
      nvda: [
        keys.INS_TAB_OR_CAPS_TAB,
        keys.INS_UP_OR_CAPS_UP
      ],
      voiceover: [
      ]
    }
  },
  "Navigating to 'Text Formatting' menubar switches mode from reading to interaction": {
    reading: {
      jaws: [
        keys.TAB_AND_SHIFT_TAB
      ]
    }
  },
  "Navigating to menubar": {
    reading: {
      jaws: [
        keys.TAB_AND_SHIFT_TAB
      ]
    },
    interaction: {
      jaws: [
        keys.F_AND_SHIFT_F,
        keys.TAB_AND_SHIFT_TAB,
        keys.UP_AND_DOWN,
        keys.LEFT_AND_RIGHT (with Smart Navigation on)
      ]
    }
  },
  "Navigating to menuitemradio": {
    reading: {
      jaws: [
        keys.UP_AND_DOWN
      ]
    },
    interaction: {
      jaws: [
        keys.UP_AND_DOWN,
        keys.S (Navigate by first letter of menuitem)
      ]
    }
  },
  "Navigating to menuitemcheckbox": {
    reading: {
      jaws: [
        keys.UP_AND_DOWN
      ]
    },
    interaction: {
      jaws: [
        keys.UP_AND_DOWN,
        keys.B (Navigate by first letter of menuitem)
      ]
    }
  },
  "Operating a role='menuitemradio' widget": {
    reading: {
      jaws: [
        keys.ENTER,
        keys.SPACE
      ]
    },
    interaction: {
      jaws: [
        keys.ENTER,
        keys.SPACE
      ]
    }
  },
  "Operating a role='menuitemcheckbox' widget": {
    reading: {
      jaws: [
        keys.ENTER,
        keys.SPACE
      ]
    },
    interaction: {
      jaws: [
        keys.ENTER,
        keys.SPACE
      ]
    }
  },
  "Operating a role='menuitem' widget": {
    reading: {
      jaws: [
        keys.ESC
      ]
    },
    interaction: {
      jaws: [
        keys.ESC
      ]
    }
  },
  "Reading Text Color group": {
    reading: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    },
    interaction: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    }
  },
  "Reading menuitem in menubar": {
    reading: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    },
    interaction: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    }
  },
  "Reading menuitemradio": {
    reading: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    },
    interaction: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    }
  },
  "Reading menuitemcheckbox": {
    reading: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    },
    interaction: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    }
  },
  "Reading disabled menuitem": {
    reading: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    },
    interaction: {
      jaws: [
        keys.INSERT_TAB,
        keys.INSERT_UP
      ]
    }
  }
};

const MODE_INSTRUCTIONS = {
  reading: {
    jaws: `Put JAWS into Virtual Cursor Mode using ${keys.INS_Z}`,
    nvda: `Put NVDA into Browser Mode using ${keys.ESC}`,
    voiceover: ``
  },
  interaction: {
    jaws: `Put JAWS into Forms Mode by turning Virual Cursor off using ${keys.INS_Z}`,
    nvda: `Put NVDA into Focus Mode using NVDA+Space`,
    voiceover: `Turn Quick Nav off by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`
  }
