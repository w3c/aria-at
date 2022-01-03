window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterButton(testPageDocument) {
    // sets focus on a link after the button
    testPageDocument.querySelector('#afterlink').focus();
  }
});
