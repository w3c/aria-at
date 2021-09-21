// sets the state of the first radio button to checked, and sets focus on a link after the radio group
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach((r) => {
  r.setAttribute('aria-checked', 'false');
  r.tabIndex = -1;
});
radios[0].setAttribute('aria-checked', 'true');
radios[0].tabIndex = 0;
testPageDocument.querySelector('#afterlink').focus();
