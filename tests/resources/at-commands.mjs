
const KNOWN_ATS = {
  jaws: 'JAWS',
  nvda: 'NVDA',
  voiceover: 'VoiceOver'
}

/* Add new commands here */

const AT_COMMAND_MAP = {
  "navigate to checkbox": {
    reading: {
      jaws: [
        "X / Shift+X",
        "Tab / Shift+Tab",
        "Up / Down",
        "Left / Right (with Smart Navigation on)",
        "Control+Insert+X to see a list of checkboxes; then use the Up/Down arrows to select a checkbox; then press Enter to navigate to that checkbox",
        "Insert+Tab (or CapsLock+Tab) with the cursor already on the checkbox",
        "Insert+Up (or CapsLock+I) with the cursor already on the checkbox"
      ],
      nvda: [
        "X / Shift+X",
        "Tab / Shift+Tab",
        "Up / Down",
        "Insert+Down (or CapsLock+Down)",
        "Insert+F7 (or CapsLock+F7) to access list of elements on the page; then select ‘type’ = ‘form fields’; then select a checkbox in the list of form controls; then press ‘Enter’ to navigate to that checkbox",
        "Insert+Tab (or CapsLock+Tab) with the cursor already on the checkbox",
        "Insert+Up (or CapsLock+Up) with the cursor already on the checkbox"
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
        "Tab / Shift+Tab",
        "Insert+Tab (or CapsLock+Tab) with the cursor already on the checkbox",
        "Insert+Up (or CapsLock+I) with the cursor already on the checkbox"
      ],
      nvda: [
        "Tab / Shift+Tab",
        "Insert+Tab (or CapsLock+Tab) with the cursor already on the checkbox",
        "Insert+Up (or CapsLock+Up) with the cursor already on the checkbox"
      ],
      voiceover: [
        "Tab / Shift+Tab",
        "Control+Option+Right / Ctrl+Option+Left",
        "Control+Option+A",
        "Control+Option+Command+J / Shift+Control+Option+Command+J",
        "Control+Option+Command+C / Shift+Control+Option+Command+C",
        "Control+U to open the ‘Rotor’ menu; then press the Right arrow until the list of 'Form Controls’ appears; then select a checkbox in the list of form controls using the Up/Down arrow keys; then press ‘Enter’ to navigate to that checkbox"
      ]
    }
  },
  "operate checkbox": {
    reading: {
      jaws: [
        "Enter",
        "Space"
      ],
      nvda: [
        "Enter",
        "Space"
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
        "Space"
      ],
      nvda: [
        "Space"
      ],
      voiceover: [
        "Control+Option+Space",
        "Space"
      ]
    }
  },
  "navigate to checkbox group": {
    reading: {
      jaws: [
        "Up / Down",
        "Tab / Shift+Tab",
        "Control+Insert+X to see a list of checkboxes; then use the Up/Down arrows to select a checkbox; then press Enter to navigate to that checkbox",
        "Insert+Tab (or CapsLock+Tab) with the cursor already on the checkbox",
        "Insert+Up (or CapsLock+I) with the cursor already on the checkbox"
      ],
      nvda: [
        "X / Shift+X",
        "Up / Down",
        "Tab / Shift+Tab",
        "Insert+Down (or CapsLock+Down)",
        "Insert+F7 (or CapsLock+F7) to access list of elements on the page; then select ‘type’ = ‘form fields’; then select a checkbox in the list of form controls; then press ‘Enter’ to navigate to that checkbox",
        "Insert+Tab (or CapsLock+Tab) with the cursor already on the checkbox",
        "Insert+Up (or CapsLock+Up) with the cursor already on the checkbox"
      ],
      voiceover: [
      ]
    },
    interaction: {
      jaws: [
	"Tab / Shift+Tab",
        "Insert+Tab (or CapsLock+Tab) with the cursor already on the checkbox",
        "Insert+Up (or CapsLock+I) with the cursor already on the checkbox"
      ],
      nvda: [
        "Tab / Shift+Tab",
        "Insert+Tab (or CapsLock+Tab) with the cursor already on the checkbox",
        "Insert+Up (or CapsLock+Up) with the cursor already on the checkbox"
      ],
      voiceover: [
        "Tab / Shift+Tab",
        "Control+Option+Right / Ctrl+Option+Left",
        "Control+Option+A",
        "Control+Option+Command+J / Shift+Control+Option+Command+J",
        "Control+Option+Command+C / Shift+Control+Option+Command+C",
        "Control+U to open the ‘Rotor’ menu; then press the Right arrow until the list of 'Form Controls’ appears; then select a checkbox in the list of form controls using the Up/Down arrow keys; then press ‘Enter’ to navigate to that checkbox"
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
