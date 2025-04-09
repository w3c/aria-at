window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterLink(testPageDocument) {
    // sets focus on a link after the 'W3C website' link
    testPageDocument.getElementById('afterlink').focus();
  }
});
