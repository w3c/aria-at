export function moveFocusAfterCombobox(testPageDocument) {
  // sets focus on a link after the Combobox
  testPageDocument.querySelector('#cb1-button').style.display = 'none';
  testPageDocument.querySelector('#afterlink').focus();
}

export function moveFocusAfterComboboxAndSetValueToAlabama(testPageDocument) {
  // sets focus on a link after the Combobox, and sets the combobox value to 'Alabama'
  testPageDocument.querySelector('#cb1-button').style.display = 'none';
  testPageDocument.defaultView.comboboxController.setValue('Alabama');
  testPageDocument.querySelector('#afterlink').focus();
}

export function moveFocusBeforeCombobox(testPageDocument) {
  // sets focus on a link before the Combobox
  testPageDocument.querySelector('#beforelink').focus();
}

export function moveFocusBeforeComboboxAndSetValueToAlabama(testPageDocument) {
  // sets focus on a link before the Combobox, and sets the combobox value to 'Alabama'
  testPageDocument.defaultView.comboboxController.setValue('Alabama');
  testPageDocument.querySelector('#beforelink').focus();
}

export function moveFocusToAlabamaInListbox(testPageDocument) {
  // expands the Combobox and places focus on 'Alabama' in the listbox popup
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  testPageDocument.defaultView.comboboxController.setVisualFocusListbox();
  let opt = testPageDocument.querySelector('#lb1-al');
  testPageDocument.defaultView.comboboxController.setOption(opt, true);
}

export function moveFocusToAlabamaInListboxAndSetInputCursorAtBeginning(testPageDocument) {
  // expands the combobox,  sets the combobox value to 'Alabama', places focus on that option in the listbox popup and positions the editing cursor at the beginning of the textbox
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  testPageDocument.defaultView.comboboxController.setVisualFocusListbox();
  let opt = testPageDocument.querySelector('#lb1-al');
  testPageDocument.defaultView.comboboxController.setOption(opt, true);
  testPageDocument.defaultView.comboboxController.comboboxNode.setSelectionRange(0, 0);
}

export function moveFocusToAlabamaInListboxAndSetInputCursorAtEnd(testPageDocument) {
  // expands the combobox,  sets the combobox value to 'Alabama', places focus on that option in the listbox popup and positions the editing cursor at the end of the textbox
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  testPageDocument.defaultView.comboboxController.setVisualFocusListbox();
  let opt = testPageDocument.querySelector('#lb1-al');
  let optTextLength = opt.textContent.length;
  testPageDocument.defaultView.comboboxController.setOption(opt, true);
  testPageDocument.defaultView.comboboxController.comboboxNode.setSelectionRange(
    optTextLength,
    optTextLength
  );
}

export function moveFocusToAlaskaInListbox(testPageDocument) {
  // expands the combobox, sets the combobox value to 'Alaska' and places focus on that option in the listbox popup
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  testPageDocument.defaultView.comboboxController.setVisualFocusListbox();
  let opt = testPageDocument.querySelector('#lb1-ak');
  testPageDocument.defaultView.comboboxController.setOption(opt, true);
}

export function moveFocusToAndExpandCombobox(testPageDocument) {
  // sets focus on and expands the combobox
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}

export function moveFocusToAndExpandComboboxAndSetValueToA(testPageDocument) {
  // sets focus on and expands the combobox, and sets the combobox value to 'a'
  testPageDocument.defaultView.comboboxController.setValue('a');
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.select();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}

export function moveFocusToAndExpandComboboxAndSetValueToAWithInputTextDeselected(testPageDocument) {
  // sets focus on and expands the combobox, sets the combobox value to 'a', and de-selects all text in the input
  testPageDocument.defaultView.comboboxController.setValue('a');
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}

export function moveFocusToAndExpandComboboxAndSetValueToAlabama(testPageDocument) {
  // sets focus on and expands the combobox, and sets the combobox value to 'Alabama'
  testPageDocument.defaultView.comboboxController.setValue('Alabama');
  testPageDocument.defaultView.comboboxController.open();
  testPageDocument.defaultView.comboboxController.comboboxNode.select();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}

export function moveFocusToCombobox(testPageDocument) {
  // sets focus on the combobox
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}

export function moveFocusToComboboxAndSetValueToA(testPageDocument) {
  // sets focus on the combobox, and sets the combobox value to 'a'
  testPageDocument.defaultView.comboboxController.setValue('a');
  testPageDocument.defaultView.comboboxController.comboboxNode.select();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}

export function moveFocusToComboboxAndSetValueToAlabama(testPageDocument) {
  // sets focus on the combobox, and sets the combobox value to 'Alabama'
  testPageDocument.defaultView.comboboxController.setValue('Alabama');
  testPageDocument.defaultView.comboboxController.comboboxNode.select();
  testPageDocument.defaultView.comboboxController.comboboxNode.focus();
}
