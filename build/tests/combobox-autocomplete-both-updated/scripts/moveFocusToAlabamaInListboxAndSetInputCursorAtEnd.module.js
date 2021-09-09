export function moveFocusToAlabamaInListboxAndSetInputCursorAtEnd(testPageDocument) {
  // expands the combobox,  sets the combobox value to 'Alabama', places focus on that option in the listbox popup and positions the editing cursor at the end of the textbox
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  testPageDocument.defaultView.comboboxController.setVisualFocusListbox();
  let opt = testPageDocument.querySelector('#lb1-al');
  let optTextLength = opt.textContent.length;
  testPageDocument.defaultView.comboboxController.setOption(opt, true);
  testPageDocument.defaultView.comboboxController.comboboxNode.setSelectionRange(optTextLength, optTextLength);
}
