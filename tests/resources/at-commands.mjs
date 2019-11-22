
const KNOWN_ATS = {
  jaws: 'JAWS',
  nvda: 'NVDA',
  voiceover: 'VoiceOver'
}

/* Add new commands here */

const AT_COMMAND_MAP = {
  "read checkbox": {
    reading: {
      jaws: [
        ["navigate to the checkbox using", "X / Shift+X"],
        ["navigate to the checkbox using", "Tab / Shift+Tab"],
        ["navigate to the checkbox using", "Up / Down"],
        ["navigate to the checkbox using", "Left / Right (with Smart Navigation on)"],
        ["navigate to the checkbox using", "Control+Insert+X to see a list of checkboxes; then use the Up/Down arrows to select a checkbox; then press Enter to navigate to that checkbox"],
        ["when the cursor is on the checkbox, read it using", "Insert+Tab (or CapsLock+Tab)"],
        ["when the cursor is on the checkbox, read it using", "Insert+Up (or CapsLock+I)"]
      ],
      nvda: [
        ["navigate to the checkbox using", "X / Shift+X"],
        ["navigate to the checkbox using", "Tab / Shift+Tab"],
        ["navigate to the checkbox using", "Up / Down"],
        ["navigate to the checkbox using", "Insert+Down (or CapsLock+Down)"],
        ["navigate to the checkbox using", "Insert+F7 (or CapsLock+F7) to access list of elements on the page; then select ‘type’ = ‘form fields’; then select a checkbox in the list of form controls; then press ‘Enter’ to navigate to that checkbox"],
        ["when the cursor is on the checkbox, read it using", "Insert+Tab (or CapsLock+Tab)"],
        ["when the cursor is on the checkbox, read it using", "Insert+Up (or CapsLock+Up)"]
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
        ["navigate to the checkbox using", "Tab / Shift+Tab"],
        ["when the cursor is on the checkbox, read it using", "Insert+Tab (or CapsLock+Tab)"],
        ["when the cursor is on the checkbox, read it using", "Insert+Up (or CapsLock+I)"]
      ],
      nvda: [
        ["navigate to the checkbox using", "Tab / Shift+Tab"],
        ["when the cursor is on the checkbox, read it using", "Insert+Tab (or CapsLock+Tab)"],
        ["when the cursor is on the checkbox, read it using", "Insert+Up (or CapsLock+Up)"]
      ],
      voiceover: [
        ["navigate to the checkbox using", "Tab / Shift+Tab"],
        ["navigate to the checkbox using", "Control+Option+Right / Ctrl+Option+Left"],
        ["navigate to the checkbox using", "Control+Option+A"],
        ["navigate to the checkbox using", "Control+Option+Command+J / Shift+Control+Option+Command+J"],
        ["navigate to the checkbox using", "Control+Option+Command+C / Shift+Control+Option+Command+C"],
        ["navigate to the checkbox using", "Control+U to open the ‘Rotor’ menu; then press the Right arrow until the list of 'Form Controls’ appears; then select a checkbox in the list of form controls using the Up/Down arrow keys; then press ‘Enter’ to navigate to that checkbox"]
      ]
    }
  },
  "operate checkbox": {
    reading: {
      jaws: [
        ["when the cursor is on the checkbox, change the state using", "Enter"],
        ["when the cursor is on the checkbox, change the state using", "Space"]
      ],
      nvda: [
        ["when the cursor is on the checkbox, change the state using", "Enter"],
        ["when the cursor is on the checkbox, change the state using", "Space"]
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
        ["when the cursor is on the checkbox, change the state using", "Space"]
      ],
      nvda: [
        ["when the cursor is on the checkbox, change the state using", "Space"]
      ],
      voiceover: [
        ["when the cursor is on the checkbox, change the state using", "Control+Option+Space"],
        ["when the cursor is on the checkbox, change the state using", "Space"]
      ]
    }
  },
  "navigate to checkbox group": {
    reading: {
      jaws: [
        ["navigate through group boundaries using", "Up / Down"],
        ["navigate through group boundaries using", "Tab / Shift+Tab"],
        ["navigate through group boundaries using", "Control+Insert+X to see a list of checkboxes; then use the Up/Down arrows to select a checkbox; then press Enter to navigate to that checkbox"],
        ["when the cursor is on a checkbox, read the group using", "Insert+Tab (or CapsLock+Tab)"],
        ["when the cursor is on a checkbox, read the group using", "Insert+Up (or CapsLock+I)"]
      ],
      nvda: [
        ["navigate through group boundaries using", "X / Shift+X"],
        ["navigate through group boundaries using", "Up / Down"],
        ["navigate through group boundaries using", "Tab / Shift+Tab"],
        ["navigate through group boundaries using", "Insert+Down (or CapsLock+Down)"],
        ["navigate through group boundaries using", "Insert+F7 (or CapsLock+F7) to access list of elements on the page; then select ‘type’ = ‘form fields’; then select a checkbox in the list of form controls; then press ‘Enter’ to navigate to that checkbox"],
        ["when the cursor is on a checkbox, read the group using", "Insert+Tab (or CapsLock+Tab)"],
        ["when the cursor is on a checkbox, read the group using", "Insert+Up (or CapsLock+Up)"]
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
	["navigate through group boundaries using", "Tab / Shift+Tab"],
        ["when the cursor is on a checkbox, read the group using", "Insert+Tab (or CapsLock+Tab)"],
        ["when the cursor is on a checkbox, read the group using", "Insert+Up (or CapsLock+I)"]
      ],
      nvda: [
        ["navigate through group boundaries using", "Tab / Shift+Tab"],
        ["when the cursor is on a checkbox, read the group using", "Insert+Tab (or CapsLock+Tab)"],
        ["when the cursor is on a checkbox, read the group using", "Insert+Up (or CapsLock+Up)"]
      ],
      voiceover: [
        ["navigate through group boundaries using", "Tab / Shift+Tab"],
        ["navigate through group boundaries using", "Control+Option+Right / Ctrl+Option+Left"],
        ["navigate through group boundaries using", "Control+Option+A"],
        ["navigate through group boundaries using", "Control+Option+Command+J / Shift+Control+Option+Command+J"],
        ["navigate through group boundaries using", "Control+Option+Command+C / Shift+Control+Option+Command+C"],
        ["navigate through group boundaries using", "Control+U to open the ‘Rotor’ menu; then press the Right arrow until the list of 'Form Controls’ appears; then select a checkbox in the list of form controls using the Up/Down arrow keys; then press ‘Enter’ to navigate to that checkbox"]
      ]
    }
  }
};

const MODE_INSTRUCTIONS = {
  reading: {
    jaws: "Put JAWS into Virtual Cursor Mode using Insert-Z.",
    nvda: "Put NVDA into Browser Mode using Esc",
    voiceover: ""
  },
  interaction: {
    jaws: "Put JAWS into Forms Mode by turning Virual Cursor off using insert+z.",
    nvda: "Put NVDA into Focus Mode using NVDA+Space",
    voiceover: "Turn Quick Nav off by pressing the Left Arrow and Right Arrow keys at the same time."
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
  for (let assertion of atAdditionalAssertions[at]) {
    if (assertion.keys.includes(key) && assertion.mode === mode) {
      assertions.push(assertion.assertion);
    }
  }
  return assertions;
}
