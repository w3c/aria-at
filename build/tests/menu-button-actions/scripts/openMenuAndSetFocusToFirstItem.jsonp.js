window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openMenuAndSetFocusToFirstItem(testPageDocument) {
    // opens the menu, and sets focus on 'Action 1'
    testPageDocument.defaultView.menuController.openPopup();
    testPageDocument.defaultView.menuController.setFocusToFirstMenuitem();
  }
});
