window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  focusontextalign(testPageDocument) {
    // Move focus to the "Text Align" menu item
    testPageDocument.querySelectorAll('[role=menuitem]')[2].focus();
  }
});
