window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterSlider(testPageDocument) {
    // sets focus on a link after the slider
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeSlider(testPageDocument) {
    // sets focus on a link before the slider
    testPageDocument.querySelector('#beforelink').focus();
  },
  setFocusOnSlider(testPageDocument) {
    // sets focus on the slider
    testPageDocument.querySelector('[role="slider"]').focus();
  }
});
