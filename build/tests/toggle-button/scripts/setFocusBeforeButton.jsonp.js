window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeButton(testPageDocument) {
    // sets focus on a link before the button
    testPageDocument.querySelector('#beforelink').focus();
  }
});
