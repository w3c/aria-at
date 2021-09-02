window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterButton(testPageDocument) {
    // sets focus on a link after the button
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeButton(testPageDocument) {
    // sets focus on a link before the button
    testPageDocument.querySelector('#beforelink').focus();
  },
  setFocusOnButton(testPageDocument) {
    // sets focus on the button
    testPageDocument.querySelector('#toggle').focus();
  },
  setFocusOnButtonAndSetStateToPressed(testPageDocument) {
    // sets focus on the button, and sets its state to 'pressed'
    let button = testPageDocument.querySelector('#toggle');
    button.setAttribute('aria-pressed', 'true');
    button.querySelector('use').setAttribute('xlink:href', '#icon-sound');
    button.focus();
  }
});
