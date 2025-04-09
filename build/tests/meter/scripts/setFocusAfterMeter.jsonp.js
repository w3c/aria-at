window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterMeter(testPageDocument) {
    // sets focus on a link after the meter
    testPageDocument.getElementById('afterlink').focus();
  }
});
