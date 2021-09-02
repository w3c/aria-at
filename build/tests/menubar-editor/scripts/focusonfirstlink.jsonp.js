window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  focusonfirstlink(testPageDocument) {
    // Move focus to the link just before the meunbar
    testPageDocument.querySelector('a').focus();
  }
});
