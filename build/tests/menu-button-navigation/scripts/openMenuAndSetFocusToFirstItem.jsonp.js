window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openMenuAndSetFocusToFirstItem(testPageDocument) {
    // opens the menu, and sets focus on 'W3C Home Page'
    testPageDocument.defaultView.menuController.openPopup();
    testPageDocument.defaultView.menuController.setFocusToFirstMenuitem();
  }
});
