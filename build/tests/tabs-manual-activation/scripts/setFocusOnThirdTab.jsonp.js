window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnThirdTab(testPageDocument) {
    // sets focus on the third tab
    testPageDocument.querySelector('#complex').focus();
  }
});
