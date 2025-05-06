window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openMenuAndSetFocusToLastItem(testPageDocument) {
    // opens the menu, and sets focus on 'Accessible Name and Description'
    testPageDocument.defaultView.menuController.openPopup();
    testPageDocument.defaultView.menuController.setFocusToLastMenuitem();
  }
});
