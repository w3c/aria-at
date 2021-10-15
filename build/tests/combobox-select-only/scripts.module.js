export function moveFocusAfterCombobox(testPageDocument) {
  // sets focus on a link after the Combobox
  testPageDocument.querySelector('#afterlink').focus();
}

export function moveFocusBeforeCombobox(testPageDocument) {
  // sets focus on a link before the Combobox
  testPageDocument.querySelector('#beforelink').focus();
}

export function moveFocusToCombobox(testPageDocument) {
  // sets focus on the combobox
  testPageDocument.querySelector('[role="combobox"]').focus();
}

export function openListbox(testPageDocument) {
  // sets focus on and expands the Combobox
  testPageDocument.querySelector('[role="combobox"]').focus();
  testPageDocument.defaultView.selectController.updateMenuState(true);
}

export function openListboxToApple(testPageDocument) {
  // sets focus on and expands the Combobox, and sets the focused option to 'Apple'
  testPageDocument.querySelector('[role="combobox"]').focus();
  testPageDocument.defaultView.selectController.updateMenuState(true);
  testPageDocument.defaultView.selectController.onOptionChange(1);
}

export function openListboxToGuava(testPageDocument) {
  // sets focus on and expands the Combobox, and sets the focused option to 'Guave'
  testPageDocument.querySelector('[role="combobox"]').focus();
  testPageDocument.defaultView.selectController.updateMenuState(true);
  testPageDocument.defaultView.selectController.onOptionChange(11);
}

export function openListboxToHuckleberry(testPageDocument) {
  // sets focus on and expands the Combobox, and sets the focused option to 'Huckleberry'
  testPageDocument.querySelector('[role="combobox"]').focus();
  testPageDocument.defaultView.selectController.updateMenuState(true);
  testPageDocument.defaultView.selectController.onOptionChange(12);
}
