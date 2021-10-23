export function moveFocusAfterFirstCheckbox(testPageDocument) {
  // sets focus on a link after the first checkbox
  testPageDocument.querySelector('#afterlink').focus();
}

export function moveFocusBeforeFirstCheckbox(testPageDocument) {
  // sets focus on a link before the first checkbox
  testPageDocument.querySelector('#beforelink').focus();
}

export function moveFocusToAndUncheckFirstCheckbox(testPageDocument) {
  // sets focus on the first checkbox and sets its state to unchecked
  const checkbox = testPageDocument.querySelector('[role="checkbox"]');
  checkbox.setAttribute('aria-checked', 'false');
  checkbox.focus();
}

export function moveFocusToFirstCheckbox(testPageDocument) {
  // sets focus on the first checkbox
  testPageDocument.querySelector('[role="checkbox"]').focus();
}
