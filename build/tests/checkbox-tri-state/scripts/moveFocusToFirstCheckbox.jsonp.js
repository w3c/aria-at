window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToFirstCheckbox(testPageDocument) {
    // sets focus on the first checkbox
    testPageDocument.querySelector('[role="checkbox"]').focus();
  }
});
