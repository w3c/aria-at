window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterForm(testPageDocument) {
    // sets focus on a link after the form landmark
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusAfterFormAndHideBottomControls(testPageDocument) {
    // sets focus on a link after the form landmark, and hides the 'Bottom' link and 'Add Contact' button
    testPageDocument.querySelector('[type="submit"]').setAttribute('hidden', '');
    testPageDocument.getElementById('bottom').setAttribute('hidden', '');
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusBeforeForm(testPageDocument) {
    // sets focus on a link before the form landmark
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusBeforeFormAndHideTopLink(testPageDocument) {
    // sets focus on a link before the form landmark, and hides the 'Top' link
    testPageDocument.getElementById('top').setAttribute('hidden', '');
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
