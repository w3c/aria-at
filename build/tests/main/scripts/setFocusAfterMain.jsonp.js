window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterMain(testPageDocument) {
    // sets focus on a link after the main landmark
    testPageDocument.getElementById('afterlink').focus();
  }
});
