window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnAndCollapseFirstAccordionHeader(testPageDocument) {
    // collapses and sets focus on the 'Personal Information' accordion header
    testPageDocument.defaultView.accordions[0].toggle(false);
    testPageDocument.getElementById('accordion1id').focus();
  }
});
