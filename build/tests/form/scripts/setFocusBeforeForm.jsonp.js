window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeForm(testPageDocument) {
    // sets focus on a link before the form landmark
    testPageDocument.getElementById('beforelink').focus();
  }
});
