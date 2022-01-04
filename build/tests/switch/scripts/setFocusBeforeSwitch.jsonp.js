window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeSwitch(testPageDocument) {
    // sets focus on a link before the switch
    testPageDocument.getElementById('beforelink').focus();
  }
});
