export function setFocusOnThirdRadioButton(testPageDocument) {
  // sets focus on the third radio button
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[2].classList.add('focus');
  radios[2].setAttribute('tabindex', '0');
  radios[2].focus();
}
