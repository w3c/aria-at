window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterMenuButton(testPageDocument) {
    // sets focus on a link after the menu button
    testPageDocument.querySelector('#afterlink').focus();
  }
});
