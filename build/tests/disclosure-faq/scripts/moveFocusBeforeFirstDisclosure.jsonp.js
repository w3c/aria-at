window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusBeforeFirstDisclosure(testPageDocument) {
    // sets focus on a link before the first disclosure button
    testPageDocument.querySelector('#beforelink').focus();
  }
});
