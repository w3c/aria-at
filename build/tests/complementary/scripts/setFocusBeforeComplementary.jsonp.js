window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeComplementary(testPageDocument) {
    // sets focus on a link before the complementary landmark
    testPageDocument.getElementById('beforelink').focus();
  }
});
