window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeRadioGroup(testPageDocument) {
    // sets focus on a link before the radio group
    testPageDocument.querySelector('#beforelink').focus();
  }
});
