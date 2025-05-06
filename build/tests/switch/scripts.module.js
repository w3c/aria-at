export function setFocusAfterAndTurnOnSwitch(testPageDocument) {
  // sets focus on a link after the switch, and sets the switch state to 'on'
  testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
  testPageDocument.getElementById('afterlink').focus();
}

export function setFocusAfterSwitch(testPageDocument) {
  // sets focus on a link after the switch
  testPageDocument.getElementById('afterlink').focus();
}

export function setFocusBeforeAndTurnOnSwitch(testPageDocument) {
  // sets focus on a link before the switch, and sets the state of the switch to 'on'
  testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
  testPageDocument.getElementById('beforelink').focus();
}

export function setFocusBeforeSwitch(testPageDocument) {
  // sets focus on a link before the switch
  testPageDocument.getElementById('beforelink').focus();
}

export function setFocusOnAndTurnOnSwitch(testPageDocument) {
  // sets focus on the 'Notifications' switch, and sets its state to 'on'
  testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
  testPageDocument.querySelector('[role="switch"]').focus();
}

export function setFocusOnSwitch(testPageDocument) {
  // sets focus on the 'Notifications' switch
  testPageDocument.querySelector('[role="switch"]').focus();
}
