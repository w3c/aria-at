export function moveFocusToCombobox(testPageDocument) {
  // sets focus on the combobox
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}
