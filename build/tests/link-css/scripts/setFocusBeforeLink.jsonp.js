window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeLink(testPageDocument) {
    // sets focus on a link before the 'W3C website' link
    testPageDocument.getElementById('beforelink').focus();
  }
});
