window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  focusonfont(testPageDocument) {
    // Move focus to the "Font" menu item
    testPageDocument.querySelectorAll('[role=menuitem]')[0].focus();
  }
});
