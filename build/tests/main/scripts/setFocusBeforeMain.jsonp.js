window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeMain(testPageDocument) {
    // sets focus on a link before the main landmark
    testPageDocument.getElementById('beforelink').focus();
  }
});
