window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeTablist(testPageDocument) {
    // sets focus on a link before the tab list
    testPageDocument.querySelector('#beforelink').focus();
  }
});
