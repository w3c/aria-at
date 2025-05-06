window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSixthDataCell(testPageDocument) {
    // sets focus on the first cell of the third row in the grid
    testPageDocument.defaultView.ex1Grid.setFocusPointer(1, 0);
    testPageDocument.defaultView.ex1Grid.focusCell(1, 0);
  }
});
