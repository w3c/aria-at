window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterContentinfo(testPageDocument) {
    // sets focus on a link after the contentinfo landmark
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusBeforeContentinfo(testPageDocument) {
    // sets focus on a link before the contentinfo landmark
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
