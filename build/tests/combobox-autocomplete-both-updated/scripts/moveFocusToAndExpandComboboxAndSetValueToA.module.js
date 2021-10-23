export function moveFocusToAndExpandComboboxAndSetValueToA(testPageDocument) {
  // sets focus on and expands the combobox, and sets the combobox value to 'a'
  testPageDocument.defaultView.comboboxController.setValue('a');
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.select();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}
