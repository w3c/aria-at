window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterLink(testPageDocument) {
    // sets focus on a link after the 'W3C website' link
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusBeforeLink(testPageDocument) {
    // sets focus on a link before the 'W3C website' link
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusOnLink(testPageDocument) {
    // sets focus on the 'W3C website' link
    testPageDocument.getElementById('link').focus();
  }
});
