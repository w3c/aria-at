window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeAndTurnOnSwitch(testPageDocument) {
    // sets focus on a link before the switch, and sets the state of the switch to 'on'
    testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
    testPageDocument.getElementById('beforelink').focus();
  }
});
