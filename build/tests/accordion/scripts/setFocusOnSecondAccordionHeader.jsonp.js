window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSecondAccordionHeader(testPageDocument) {
    // sets focus on the 'Billing Address' accordion header
    testPageDocument.getElementById('accordion2id').focus();
  }
});
