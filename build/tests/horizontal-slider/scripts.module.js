export function setFocusAfterRedSlider(testPageDocument) {
  // sets focus on a link after the Red slider
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeRedSlider(testPageDocument) {
  // sets focus on a link before the Red slider
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusOnRedSlider(testPageDocument) {
  // sets focus on the 'Red' slider
  testPageDocument.querySelector('[role="slider"].red').focus();
}
