export function setFocusOnAndTurnOnSwitch(testPageDocument) {
  // sets focus on the 'Notifications' switch, and sets its state to 'on'
  testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
  testPageDocument.querySelector('[role="switch"]').focus();
}
