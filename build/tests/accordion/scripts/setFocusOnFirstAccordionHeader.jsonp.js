window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnFirstAccordionHeader(testPageDocument) {
    // sets focus on the 'Personal Information' accordion header
    testPageDocument.getElementById('accordion1id').focus();
  }
});
