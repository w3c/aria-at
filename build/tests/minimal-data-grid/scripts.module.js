export function setFocusAfterGrid(testPageDocument) {
  // sets focus on a link after the grid
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeGrid(testPageDocument) {
  // sets focus on a link before the grid
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusOnFifthDataCell(testPageDocument) {
  // sets focus on the fifth cell of the second row in the grid
  testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 4);
  testPageDocument.defaultView.ex1Grid.focusCell(0, 4);
}

export function setFocusOnFirstDataCell(testPageDocument) {
  // sets focus on the first cell of the second row in the grid
  testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 0);
  testPageDocument.defaultView.ex1Grid.focusCell(0, 0);
}

export function setFocusOnFirstLinkedCell(testPageDocument) {
  // sets focus on the third cell of the second row in the grid
  testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 2);
  testPageDocument.defaultView.ex1Grid.focusCell(0, 2);
}

export function setFocusOnFourthDataCell(testPageDocument) {
  // sets focus on the fourth cell of the second row in the grid
  testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 3);
  testPageDocument.defaultView.ex1Grid.focusCell(0, 3);
}

export function setFocusOnLastDataCell(testPageDocument) {
  // sets focus on the fifth cell of the seventh row in the grid
  testPageDocument.defaultView.ex1Grid.setFocusPointer(5, 4);
  testPageDocument.defaultView.ex1Grid.focusCell(5, 4);
}

export function setFocusOnSecondDataCell(testPageDocument) {
  // sets focus on the second cell of the second row in the grid
  testPageDocument.defaultView.ex1Grid.setFocusPointer(0, 1);
  testPageDocument.defaultView.ex1Grid.focusCell(0, 1);
}

export function setFocusOnSecondLinkedCell(testPageDocument) {
  // sets focus on the third cell of the third row in the grid
  testPageDocument.defaultView.ex1Grid.setFocusPointer(1, 2);
  testPageDocument.defaultView.ex1Grid.focusCell(1, 2);
}

export function setFocusOnSixthDataCell(testPageDocument) {
  // sets focus on the first cell of the third row in the grid
  testPageDocument.defaultView.ex1Grid.setFocusPointer(1, 0);
  testPageDocument.defaultView.ex1Grid.focusCell(1, 0);
}
