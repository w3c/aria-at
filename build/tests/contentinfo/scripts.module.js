export function setFocusAfterContentinfo(testPageDocument) {
  // sets focus on a link after the contentinfo landmark
  testPageDocument.getElementById('afterlink').focus();
}

export function setFocusBeforeContentinfo(testPageDocument) {
  // sets focus on a link before the contentinfo landmark
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
