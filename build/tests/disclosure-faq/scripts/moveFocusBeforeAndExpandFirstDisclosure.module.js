export function moveFocusBeforeAndExpandFirstDisclosure(testPageDocument) {
  // sets focus on a link before the first disclosure button, and sets the state of the first button to expanded
  const btn = testPageDocument.querySelector('button[aria-controls="faq1_desc"]');
  const answer = testPageDocument.querySelector('#faq1_desc');
  btn.setAttribute('aria-expanded', 'true');
  answer.style.display = 'block';
  testPageDocument.querySelector('#beforelink').focus();
}
