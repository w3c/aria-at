window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnButton(testPageDocument) {
    // sets focus on the button
    testPageDocument.querySelector('#action').focus();
  }
});
