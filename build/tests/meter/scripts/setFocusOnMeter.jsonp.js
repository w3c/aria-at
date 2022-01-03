window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnMeter(testPageDocument) {
    // sets focus on the meter
    testPageDocument.querySelector('[role="meter"]').focus();
  }
});
