window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeRedSlider(testPageDocument) {
    // sets focus on a link before the Red slider
    testPageDocument.querySelector('#beforelink').focus();
  }
});
