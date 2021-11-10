window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnLastDataCell(testPageDocument) {
    // sets focus on the fifth cell of the seventh row in the grid
    testPageDocument.defaultView.ex1Grid.setFocusPointer(5, 4);
    testPageDocument.defaultView.ex1Grid.focusCell(5, 4);
  }
});
