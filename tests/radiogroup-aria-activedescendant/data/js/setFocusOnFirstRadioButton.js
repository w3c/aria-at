// sets focus on the first radio button
let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
  r.setAttribute('aria-checked', 'false');
  r.classList.remove('focus');
});
radios[0].classList.add('focus');
radioGroup.setAttribute('aria-activedescendant', radios[0].id);
radioGroup.focus();
