window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  checkFirstCheckbox(testPageDocument) {
    // Set aria-checked on first checkbox
    testPageDocument.querySelector('[role="checkbox"]').setAttribute('aria-checked', 'true');
  }
});
