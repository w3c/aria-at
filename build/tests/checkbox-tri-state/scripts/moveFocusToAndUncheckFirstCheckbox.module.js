export function moveFocusToAndUncheckFirstCheckbox(testPageDocument) {
  // sets focus on the first checkbox and sets its state to unchecked
  const checkbox = testPageDocument.querySelector('[role="checkbox"]');
  checkbox.setAttribute('aria-checked', 'false');
  checkbox.focus();
}
