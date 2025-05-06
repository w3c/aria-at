export function openMenuAndSetFocusToFirstItem(testPageDocument) {
  // opens the menu, and sets focus on 'W3C Home Page'
  testPageDocument.defaultView.menuController.openPopup();
  testPageDocument.defaultView.menuController.setFocusToFirstMenuitem();
}

export function openMenuAndSetFocusToLastItem(testPageDocument) {
  // opens the menu, and sets focus on 'Accessible Name and Description'
  testPageDocument.defaultView.menuController.openPopup();
  testPageDocument.defaultView.menuController.setFocusToLastMenuitem();
}

export function setFocusAfterMenuButton(testPageDocument) {
  // sets focus on a link after the menu button
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeMenuButton(testPageDocument) {
  // sets focus on a link before the menu button
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusOnMenuButton(testPageDocument) {
  // sets focus on the menu button
  testPageDocument.querySelector('#menubutton').focus();
}
