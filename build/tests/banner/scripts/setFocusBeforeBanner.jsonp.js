window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeBanner(testPageDocument) {
    // sets focus on a link before the banner landmark
    testPageDocument.getElementById('beforelink').focus();
  }
});
