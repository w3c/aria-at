// sets the state of the third radio button to checked, and sets focus on a link after the radio group
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
  r.setAttribute('tabindex', '-1');
  r.setAttribute('aria-checked', 'false');
  r.classList.remove('focus');
});
radios[2].setAttribute('tabindex', '0');
radios[2].setAttribute('aria-checked', 'true');
testPageDocument.querySelector('#afterlink').focus();
