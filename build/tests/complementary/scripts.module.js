export function setFocusAfterComplementary(testPageDocument) {
  // sets focus on a link after the complementary landmark
  testPageDocument.getElementById('afterlink').focus();
}

export function setFocusBeforeComplementary(testPageDocument) {
  // sets focus on a link before the complementary landmark
  testPageDocument.getElementById('beforelink').focus();
}

export function setFocusOnBottomLink(testPageDocument) {
  // sets focus on the 'Bottom' link
  testPageDocument.getElementById('bottom').focus();
}

export function setFocusOnTopLink(testPageDocument) {
  // sets focus on the 'Top' link
  testPageDocument.getElementById('top').focus();
}
