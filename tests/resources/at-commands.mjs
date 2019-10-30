
const KNOWN_ATS = {
  jaws: 'JAWS'
}

/* Add new commands here */

const AT_COMMAND_MAP = {
  "navigate to checkbox": {
    reading: {
      jaws: [
        "Insert+Tab",
        "Insert+Up",
        "X quick key",
        "Tab/Shift+Tab",
        "Up/Down",
        "Left/Right (Smart Nav On)]"
      ]
    },
    interaction: {
      jaws: [
        "Insert+Tab",
        "Insert+Up",
        "Tab/Shift+Tab"
      ]
    }
  },
  "operate checkbox": {
    reading: {
      jaws: [
        "enter",
        "space"
      ]
    },
    interaction: {
      jaws: [
        "space"
      ]
    }
  },
  "navigate to checkbox group": {
    reading: {
      jaws: [
	"Tab/Shift+Tab",
	"up/down",
	"Insert+Tab on checkbox",
	"Insert+Up on checkbox"
      ]
    },
    interaction: {
      jaws: [
	"Tab/Shift+Tab",
	"up/down",
	"Insert+Tab on checkbox",
	"Insert+Up on checkbox"
      ]
    }
  }
};

const MODE_INSTRUCTIONS = {
  reading: {
    jaws: "Put JAWS into Virtual Cursor Mode using insert-z."
  },
  interaction: {
    jaws: "Put JAWS into Forms Mode by turning Virual Cursor off using insert+z."
  }
};

// TODO: handle errors
export function getATCommands(mode, task, assistiveTech) {
  const at = assistiveTech.toLowerCase();
  if (AT_COMMAND_MAP[task] && AT_COMMAND_MAP[task][mode] && AT_COMMAND_MAP[task][mode][at]) {
    return AT_COMMAND_MAP[task][mode][at];
  }
  return [];
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
