// sets focus on the third radio button
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
  r.setAttribute('aria-checked', 'false');
  r.tabIndex = -1;
});
let lastRadio = radios[radios.length - 1];
lastRadio.tabIndex = 0;
lastRadio.focus();
