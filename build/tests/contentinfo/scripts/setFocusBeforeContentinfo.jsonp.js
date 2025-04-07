window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeContentinfo(testPageDocument) {
    // sets focus on a link before the contentinfo landmark
    testPageDocument.getElementById('beforelink').focus();
  }
});
