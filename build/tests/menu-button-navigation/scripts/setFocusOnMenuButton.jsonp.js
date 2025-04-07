window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnMenuButton(testPageDocument) {
    // sets focus on the menu button
    testPageDocument.querySelector('#menubutton').focus();
  }
});
