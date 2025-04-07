window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openListbox(testPageDocument) {
    // sets focus on and expands the Combobox
    testPageDocument.querySelector('[role="combobox"]').focus();
    testPageDocument.defaultView.selectController.updateMenuState(true);
  }
});
