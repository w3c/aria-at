export function setFocusAfterAndTurnOnSwitch(testPageDocument) {
  // sets focus on a link after the switch, and sets the switch state to 'on'
  testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
  testPageDocument.getElementById('afterlink').focus();
}
