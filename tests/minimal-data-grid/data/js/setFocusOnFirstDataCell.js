// sets focus on the first cell of the second row in the grid
testPageDocument.defaultView.setTimeout(() => {
	testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 0);
	testPageDocument.defaultView.ex1Grid.focusCell(0, 0);
}, 1000);
// testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 0);
