window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterAndTurnOnSwitch(testPageDocument) {
    // sets focus on a link after the switch, and sets the switch state to 'on'
    testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusAfterSwitch(testPageDocument) {
    // sets focus on a link after the switch
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusBeforeAndTurnOnSwitch(testPageDocument) {
    // sets focus on a link before the switch, and sets the state of the switch to 'on'
    testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusBeforeSwitch(testPageDocument) {
    // sets focus on a link before the switch
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusOnAndTurnOnSwitch(testPageDocument) {
    // sets focus on the 'Notifications' switch, and sets its state to 'on'
    testPageDocument.querySelector('[role="switch"]').setAttribute('aria-checked', 'true');
    testPageDocument.querySelector('[role="switch"]').focus();
  },
  setFocusOnSwitch(testPageDocument) {
    // sets focus on the 'Notifications' switch
    testPageDocument.querySelector('[role="switch"]').focus();
  }
});
