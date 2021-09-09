export function setFocusAfterButton(testPageDocument) {
  // sets focus on a link after the button
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeButton(testPageDocument) {
  // sets focus on a link before the button
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusOnButton(testPageDocument) {
  // sets focus on the button
  testPageDocument.querySelector('#action').focus();
}
