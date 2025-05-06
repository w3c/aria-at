window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterRedSlider(testPageDocument) {
    // sets focus on a link after the Red slider
    testPageDocument.querySelector('#afterlink').focus();
  }
});
