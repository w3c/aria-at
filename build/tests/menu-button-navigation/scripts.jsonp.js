window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openMenuAndSetFocusToFirstItem(testPageDocument) {
    // opens the menu, and sets focus on 'W3C Home Page'
    testPageDocument.defaultView.menuController.openPopup();
    testPageDocument.defaultView.menuController.setFocusToFirstMenuitem();
  },
  openMenuAndSetFocusToLastItem(testPageDocument) {
    // opens the menu, and sets focus on 'Accessible Name and Description'
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
    testPageDocument.querySelector('#menubutton').focus();
  }
});
