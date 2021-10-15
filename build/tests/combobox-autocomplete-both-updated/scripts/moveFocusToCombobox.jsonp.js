window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToCombobox(testPageDocument) {
    // sets focus on the combobox
    testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  }
});
