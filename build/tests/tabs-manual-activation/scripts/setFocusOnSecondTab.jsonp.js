window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSecondTab(testPageDocument) {
    // sets focus on the second tab
    testPageDocument.querySelector('#agnes').focus();
  }
});
