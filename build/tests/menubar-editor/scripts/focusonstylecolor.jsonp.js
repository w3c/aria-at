window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  focusonstylecolor(testPageDocument) {
    // Move focus to the "Style/Color" menu item
    testPageDocument.querySelectorAll('[role=menuitem]')[1].focus();
  }
});
