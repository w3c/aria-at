// sets the state of the third radio button to checked, and sets focus on a link after the radio group
let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
  r.setAttribute('aria-checked', 'false');
  r.classList.remove('focus');
});
radios[2].classList.add('focus');
radios[2].setAttribute('aria-checked', 'true');
radioGroup.setAttribute('aria-activedescendant', radios[2].id);
testPageDocument.querySelector('#afterlink').focus();
