export function moveFocusAfterCombobox(testPageDocument) {
  // sets focus on a link after the Combobox
  testPageDocument.querySelector('#cb1-button').style.display = 'none';
  testPageDocument.querySelector('#afterlink').focus();
}
