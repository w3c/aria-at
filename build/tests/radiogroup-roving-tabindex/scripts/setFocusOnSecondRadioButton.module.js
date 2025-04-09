export function setFocusOnSecondRadioButton(testPageDocument) {
  // sets focus on the second radio button
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[1].classList.add('focus');
  radios[1].setAttribute('tabindex', '0');
  radios[1].focus();
}
