window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusAfterThirdDisclosure(testPageDocument) {
    // sets focus on a link after the disclosure button
    testPageDocument.querySelector('#afterlink').focus();
  }
});
