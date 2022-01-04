export function setFocusAfterMeter(testPageDocument) {
  // sets focus on a link after the meter
  testPageDocument.getElementById('afterlink').focus();
}

export function setFocusBeforeMeter(testPageDocument) {
  // sets focus on a link before the meter
  testPageDocument.getElementById('beforelink').focus();
}

export function setFocusOnButton(testPageDocument) {
  // sets focus on the 'Change Value' button
  testPageDocument.querySelector('button.play-meters').focus();
}

export function setFocusOnMeter(testPageDocument) {
  // sets focus on the meter
  testPageDocument.querySelector('[role="meter"]').focus();
}
