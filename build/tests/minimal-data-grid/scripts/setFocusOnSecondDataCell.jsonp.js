window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSecondDataCell(testPageDocument) {
    // sets focus on the second cell of the second row in the grid
    testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 1);
    testPageDocument.defaultView.ex1Grid.focusCell(0, 1);
  }
});
