window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  checkFirstCheckbox(testPageDocument) {
    // Set aria-checked on first checkbox
    testPageDocument.querySelector('[role="checkbox"]').setAttribute('aria-checked', 'true');
  },
  moveFocusAndCheckFirstCheckbox(testPageDocument) {
    // Move focus and set aria-checked on first checkbox
    const checkbox = testPageDocument.querySelector('[role="checkbox"]');
    checkbox.focus();
    checkbox.setAttribute('aria-checked', 'true');
  },
  moveFocusToFirstCheckbox(testPageDocument) {
    // Move focus to first checkbox
    testPageDocument.querySelector('[role="checkbox"]').focus();
  }
});
