window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSlider(testPageDocument) {
    // sets focus on the slider
    testPageDocument.querySelector('[role="slider"]').focus();
  }
});
