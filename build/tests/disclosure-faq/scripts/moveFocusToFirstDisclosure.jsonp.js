window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToFirstDisclosure(testPageDocument) {
    // sets focus on the first disclosure button
    testPageDocument.querySelector('button[aria-controls="faq1_desc"]').focus();
  }
});