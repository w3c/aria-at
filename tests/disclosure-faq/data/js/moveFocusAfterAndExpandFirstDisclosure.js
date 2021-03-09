// sets the state of the first disclosure button to expanded, and sets focus on a link after the button
const btn = testPageDocument.querySelector('button[aria-controls="faq1_desc"]');
const answer = testPageDocument.querySelector('#faq1_desc');
btn.setAttribute('aria-expanded', 'true');
answer.style.display = 'block';
testPageDocument.querySelector('#afterlink').focus();
