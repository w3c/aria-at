window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openMenuAndSetFocusToLastItem(testPageDocument) {
    // opens the menu, and sets focus on 'Action 4'
    testPageDocument.defaultView.menuController.openPopup();
    testPageDocument.defaultView.menuController.setFocusToLastMenuitem();
  }
});
