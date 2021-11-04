export function setFocusAfterSlider(testPageDocument) {
  // sets focus on a link after the slider
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeSlider(testPageDocument) {
  // sets focus on a link before the slider
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusOnSlider(testPageDocument) {
  // sets focus on the slider
  testPageDocument.querySelector('[role="slider"]').focus();
}
