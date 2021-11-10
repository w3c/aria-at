window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusAfterFirstDisclosure(testPageDocument) {
    // sets focus on a link after the first disclosure button
    testPageDocument.querySelector('#afterlink').focus();
  }
});
