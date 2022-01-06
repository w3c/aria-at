window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterSwitch(testPageDocument) {
    // sets focus on a link after the switch
    testPageDocument.getElementById('afterlink').focus();
  }
});
