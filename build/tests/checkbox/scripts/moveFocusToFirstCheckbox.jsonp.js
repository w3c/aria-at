window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToFirstCheckbox(testPageDocument) {
    // Move focus to first checkbox
    testPageDocument.querySelector('[role="checkbox"]').focus();
  }
});
