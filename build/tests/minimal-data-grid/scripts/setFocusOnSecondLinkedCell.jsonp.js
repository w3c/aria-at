window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSecondLinkedCell(testPageDocument) {
    // sets focus on the third cell of the third row in the grid
    testPageDocument.defaultView.ex1Grid.setFocusPointer(1, 2);
    testPageDocument.defaultView.ex1Grid.focusCell(1, 2);
  }
});
