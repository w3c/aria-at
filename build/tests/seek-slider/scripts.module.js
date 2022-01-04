export function setFocusAfterSlider(testPageDocument) {
  // sets focus on a link after the slider
  testPageDocument.getElementById('afterlink').focus();
}

export function setFocusBeforeSlider(testPageDocument) {
  // sets focus on a link before the slider
  testPageDocument.getElementById('beforelink').focus();
}

export function setFocusOnSlider(testPageDocument) {
  // sets focus on the slider
  testPageDocument.querySelector('[role="slider"]').focus();
}
