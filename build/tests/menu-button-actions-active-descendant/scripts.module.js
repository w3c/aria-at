export function openMenuAndSetFocusToFirstItem(testPageDocument) {
  // opens the menu, and sets focus on 'Action 1'
  testPageDocument.defaultView.menuController.openPopup();
  testPageDocument.defaultView.menuController.setFocusToFirstMenuitem();
}

export function openMenuAndSetFocusToLastItem(testPageDocument) {
  // opens the menu, and sets focus on 'Action 4'
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
  testPageDocument.querySelector('#menubutton1').focus();
}
