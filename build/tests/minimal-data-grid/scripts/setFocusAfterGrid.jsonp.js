window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterGrid(testPageDocument) {
    // sets focus on a link after the grid
    testPageDocument.querySelector('#afterlink').focus();
  }
});
