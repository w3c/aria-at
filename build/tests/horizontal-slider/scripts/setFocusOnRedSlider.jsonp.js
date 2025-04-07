window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnRedSlider(testPageDocument) {
    // sets focus on the 'Red' slider
    testPageDocument.querySelector('[role="slider"].red').focus();
  }
});
