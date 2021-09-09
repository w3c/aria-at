export function setFocusOnThirdRadioButton(testPageDocument) {
  // sets focus on the third radio button
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
  	r.setAttribute('aria-checked', 'false');
  	r.classList.remove('focus');
  });
  radios[2].classList.add('focus');
  radioGroup.setAttribute('aria-activedescendant', radios[2].id);
  radioGroup.focus();
}
