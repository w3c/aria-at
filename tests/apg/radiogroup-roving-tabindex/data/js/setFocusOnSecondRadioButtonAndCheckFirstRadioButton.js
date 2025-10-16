// sets focus on the second radio button, and checks the first radio button
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
  r.setAttribute('tabindex', '-1');
  r.setAttribute('aria-checked', 'false');
  r.classList.remove('focus');
});
radios[1].classList.add('focus');
radios[1].setAttribute('tabindex', '0');
radios[0].setAttribute('aria-checked', 'true');
radios[1].focus();
