export function focusonfirstlink(testPageDocument) {
  // Move focus to the link just before the meunbar
  testPageDocument.querySelector('a').focus();
}
