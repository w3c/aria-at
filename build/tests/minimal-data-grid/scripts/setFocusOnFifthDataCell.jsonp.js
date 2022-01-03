window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnFifthDataCell(testPageDocument) {
    // sets focus on the fifth cell of the second row in the grid
    testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 4);
    testPageDocument.defaultView.ex1Grid.focusCell(0, 4);
  }
});
