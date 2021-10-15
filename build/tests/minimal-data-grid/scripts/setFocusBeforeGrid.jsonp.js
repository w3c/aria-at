window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeGrid(testPageDocument) {
    // sets focus on a link before the grid
    testPageDocument.querySelector('#beforelink').focus();
  }
});
