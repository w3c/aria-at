window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnLink(testPageDocument) {
    // sets focus on the 'W3C website' link
    testPageDocument.getElementById('link').focus();
  }
});
