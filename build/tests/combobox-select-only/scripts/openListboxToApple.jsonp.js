window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openListboxToApple(testPageDocument) {
    // sets focus on and expands the Combobox, and sets the focused option to 'Apple'
    testPageDocument.querySelector('[role="combobox"]').focus();
    testPageDocument.defaultView.selectController.updateMenuState(true);
    testPageDocument.defaultView.selectController.onOptionChange(1);
  }
});
