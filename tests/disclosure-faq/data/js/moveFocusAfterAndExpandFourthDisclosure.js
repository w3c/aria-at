// sets the state of the fourth disclosure button to expanded, and sets focus on a link after the button
const btn = testPageDocument.querySelector('button[aria-controls="faq4_desc"]');
const answer = testPageDocument.querySelector('#faq4_desc');
btn.setAttribute('aria-expanded', 'true');
answer.style.display = 'block';
testPageDocument.querySelector('#afterlink').focus();
