export function setFocusBeforeMain(testPageDocument) {
  // sets focus on a link before the main landmark
  testPageDocument.getElementById('beforelink').focus();
}
