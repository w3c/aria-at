window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterBanner(testPageDocument) {
    // sets focus on a link after the banner landmark
    testPageDocument.getElementById('afterlink').focus();
  }
});
