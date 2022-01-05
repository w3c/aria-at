window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterContentinfo(testPageDocument) {
    // sets focus on a link after the contentinfo landmark
    testPageDocument.getElementById('afterlink').focus();
  }
});
