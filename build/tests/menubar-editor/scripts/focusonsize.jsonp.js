window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  focusonsize(testPageDocument) {
    // Move focus to the "Size" menu item
    testPageDocument.querySelectorAll('[role=menuitem]')[3].focus();
  }
});
