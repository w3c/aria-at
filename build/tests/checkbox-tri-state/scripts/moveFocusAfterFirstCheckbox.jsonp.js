window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusAfterFirstCheckbox(testPageDocument) {
    // sets focus on a link after the first checkbox
    testPageDocument.querySelector('#afterlink').focus();
  }
});
