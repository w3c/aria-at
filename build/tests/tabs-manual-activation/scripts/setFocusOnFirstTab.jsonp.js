window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnFirstTab(testPageDocument) {
    // sets focus on the first tab
    testPageDocument.querySelector('#nils').focus();
  }
});
