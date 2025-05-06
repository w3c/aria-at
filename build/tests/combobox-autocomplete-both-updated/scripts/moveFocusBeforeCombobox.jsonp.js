window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusBeforeCombobox(testPageDocument) {
    // sets focus on a link before the Combobox
    testPageDocument.querySelector('#beforelink').focus();
  }
});
