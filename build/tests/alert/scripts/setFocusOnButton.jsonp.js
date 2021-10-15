window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnButton(testPageDocument) {
    // sets focus on the 'Trigger Alert' button
    testPageDocument.querySelector('#alert-trigger').focus();
  }
});
