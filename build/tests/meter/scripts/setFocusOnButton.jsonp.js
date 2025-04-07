window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnButton(testPageDocument) {
    // sets focus on the 'Change Value' button
    testPageDocument.querySelector('button.play-meters').focus();
  }
});
