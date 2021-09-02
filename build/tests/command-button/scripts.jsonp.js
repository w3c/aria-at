window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterButton(testPageDocument) {
    // sets focus on a link after the button
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeButton(testPageDocument) {
    // sets focus on a link before the button
    testPageDocument.querySelector('#beforelink').focus();
  },
  setFocusOnButton(testPageDocument) {
    // sets focus on the button
    testPageDocument.querySelector('#action').focus();
  }
});
