window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterRadioGroup(testPageDocument) {
    // sets focus on a link after the radio group
    testPageDocument.querySelector('#afterlink').focus();
  }
});
