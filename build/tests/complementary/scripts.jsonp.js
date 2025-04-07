window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterComplementary(testPageDocument) {
    // sets focus on a link after the complementary landmark
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusBeforeComplementary(testPageDocument) {
    // sets focus on a link before the complementary landmark
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusOnBottomLink(testPageDocument) {
    // sets focus on the 'Bottom' link
    testPageDocument.getElementById('bottom').focus();
  },
  setFocusOnTopLink(testPageDocument) {
    // sets focus on the 'Top' link
    testPageDocument.getElementById('top').focus();
  }
});
