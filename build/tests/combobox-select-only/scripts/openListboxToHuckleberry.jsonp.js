window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openListboxToHuckleberry(testPageDocument) {
    // sets focus on and expands the Combobox, and sets the focused option to 'Huckleberry'
    testPageDocument.querySelector('[role="combobox"]').focus();
    testPageDocument.defaultView.selectController.updateMenuState(true);
    testPageDocument.defaultView.selectController.onOptionChange(12);
  }
});
