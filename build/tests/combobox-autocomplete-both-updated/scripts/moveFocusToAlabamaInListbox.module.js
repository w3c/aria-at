export function moveFocusToAlabamaInListbox(testPageDocument) {
  // expands the Combobox and places focus on 'Alabama' in the listbox popup
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  testPageDocument.defaultView.comboboxController.setVisualFocusListbox();
  let opt = testPageDocument.querySelector('#lb1-al');
  testPageDocument.defaultView.comboboxController.setOption(opt, true);
}
