window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSwitch(testPageDocument) {
    // sets focus on the 'Notifications' switch
    testPageDocument.querySelector('[role="switch"]').focus();
  }
});
