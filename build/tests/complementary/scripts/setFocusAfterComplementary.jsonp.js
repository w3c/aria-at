window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterComplementary(testPageDocument) {
    // sets focus on a link after the complementary landmark
    testPageDocument.getElementById('afterlink').focus();
  }
});
