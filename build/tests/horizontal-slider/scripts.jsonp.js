window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterRedSlider(testPageDocument) {
    // sets focus on a link after the Red slider
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeRedSlider(testPageDocument) {
    // sets focus on a link before the Red slider
    testPageDocument.querySelector('#beforelink').focus();
  },
  setFocusOnRedSlider(testPageDocument) {
    // sets focus on the 'Red' slider
    testPageDocument.querySelector('[role="slider"].red').focus();
  }
});
