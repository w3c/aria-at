window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnBottomLink(testPageDocument) {
    // sets focus on the 'Bottom' link
    testPageDocument.getElementById('bottom').focus();
  }
});
