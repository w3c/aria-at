window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterTabpanel(testPageDocument) {
    // sets focus on a link after the tab panel
    testPageDocument.querySelector('#afterlink').focus();
  }
});
