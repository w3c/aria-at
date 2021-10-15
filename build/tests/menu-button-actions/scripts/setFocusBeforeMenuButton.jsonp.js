window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeMenuButton(testPageDocument) {
    // sets focus on a link before the menu button
    testPageDocument.querySelector('#beforelink').focus();
  }
});
