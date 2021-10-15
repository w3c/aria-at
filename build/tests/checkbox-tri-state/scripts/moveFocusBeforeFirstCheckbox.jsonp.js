window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusBeforeFirstCheckbox(testPageDocument) {
    // sets focus on a link before the first checkbox
    testPageDocument.querySelector('#beforelink').focus();
  }
});
