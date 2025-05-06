window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnTopLink(testPageDocument) {
    // sets focus on the 'Top' link
    testPageDocument.getElementById('top').focus();
  }
});
