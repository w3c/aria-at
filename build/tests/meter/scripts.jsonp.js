window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterMeter(testPageDocument) {
    // sets focus on a link after the meter
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusBeforeMeter(testPageDocument) {
    // sets focus on a link before the meter
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusOnButton(testPageDocument) {
    // sets focus on the 'Change Value' button
    testPageDocument.querySelector('button.play-meters').focus();
  },
  setFocusOnMeter(testPageDocument) {
    // sets focus on the meter
    testPageDocument.querySelector('[role="meter"]').focus();
  }
});
