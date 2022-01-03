window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openMenuAndSetFocusToFirstItem(testPageDocument) {
    // opens the menu, and sets focus on 'Action 1'
    testPageDocument.defaultView.menuController.openPopup();
    testPageDocument.defaultView.menuController.setFocusToFirstMenuitem();
  },
  openMenuAndSetFocusToLastItem(testPageDocument) {
    // opens the menu, and sets focus on 'Action 4'
    testPageDocument.defaultView.menuController.openPopup();
    testPageDocument.defaultView.menuController.setFocusToLastMenuitem();
  },
  setFocusAfterMenuButton(testPageDocument) {
    // sets focus on a link after the menu button
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeMenuButton(testPageDocument) {
    // sets focus on a link before the menu button
    testPageDocument.querySelector('#beforelink').focus();
  },
  setFocusOnMenuButton(testPageDocument) {
    // sets focus on the menu button
    testPageDocument.querySelector('#menubutton1').focus();
  }
});
