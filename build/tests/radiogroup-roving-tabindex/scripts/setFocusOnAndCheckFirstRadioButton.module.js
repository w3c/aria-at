export function setFocusOnAndCheckFirstRadioButton(testPageDocument) {
  // sets focus on the first radio button, and sets its state to checked
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radios[0].setAttribute('tabindex', '0');
  radios[0].setAttribute('aria-checked', 'true');
  radios[0].focus();
}
