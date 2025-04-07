window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterMain(testPageDocument) {
    // sets focus on a link after the main landmark
    testPageDocument.querySelector('.button-run-test-setup').parentElement.style.display = 'none';
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusBeforeMain(testPageDocument) {
    // sets focus on a link before the main landmark
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusOnBottomLink(testPageDocument) {
    // sets focus on the 'Bottom' link
    testPageDocument.querySelector('.button-run-test-setup').parentElement.style.display = 'none';
    testPageDocument.getElementById('bottom').focus();
  },
  setFocusOnTopLink(testPageDocument) {
    // sets focus on the 'Top' link
    testPageDocument.getElementById('top').focus();
  }
});
