window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeSlider(testPageDocument) {
    // sets focus on a link before the slider
    testPageDocument.querySelector('#beforelink').focus();
  }
});
