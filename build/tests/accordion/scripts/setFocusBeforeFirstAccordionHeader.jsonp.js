window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeFirstAccordionHeader(testPageDocument) {
    // sets focus on a link before the 'Personal Information' accordion header
    testPageDocument.getElementById('beforelink').focus();
  }
});
