export function moveFocusToAndExpandComboboxAndSetValueToAlabama(testPageDocument) {
  // sets focus on and expands the combobox, and sets the combobox value to 'Alabama'
  testPageDocument.defaultView.comboboxController.setValue('Alabama');
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.select();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}
