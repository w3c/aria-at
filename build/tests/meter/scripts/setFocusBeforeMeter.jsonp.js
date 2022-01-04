window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeMeter(testPageDocument) {
    // sets focus on a link before the meter
    testPageDocument.getElementById('beforelink').focus();
  }
});
