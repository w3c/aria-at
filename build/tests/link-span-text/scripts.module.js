export function setFocusAfterLink(testPageDocument) {
  // sets focus on a link after the 'W3C website' link
  testPageDocument.getElementById('afterlink').focus();
}

export function setFocusBeforeLink(testPageDocument) {
  // sets focus on a link before the 'W3C website' link
  testPageDocument.getElementById('beforelink').focus();
}

export function setFocusOnLink(testPageDocument) {
  // sets focus on the 'W3C website' link
  testPageDocument.getElementById('link').focus();
}
