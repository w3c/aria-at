export function setFocusOnSecondRadioButton(testPageDocument) {
  // sets focus on the second radio button
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
  	r.setAttribute('aria-checked', 'false');
  	r.tabIndex = -1;
  });
  radios[1].tabIndex = 0;
  radios[1].focus();
}
