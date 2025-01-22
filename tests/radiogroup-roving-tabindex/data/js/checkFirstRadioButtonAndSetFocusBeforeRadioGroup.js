// sets the state of the first radio button to checked, sets focus on a link before the radio group, and hides the group heading
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
  r.setAttribute('tabindex', '-1');
  r.setAttribute('aria-checked', 'false');
  r.classList.remove('focus');
});
radios[0].setAttribute('tabindex', '0');
radios[0].setAttribute('aria-checked', 'true');
testPageDocument.querySelector('#beforelink').focus();
testPageDocument.querySelector('#group_label_1').style.display = 'none';
