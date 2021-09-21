// sets the state of the first radio button to checked, sets focus on a link before the radio group, and hides the group heading
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach((r) => {
  r.setAttribute('aria-checked', 'false');
  r.tabIndex = -1;
});
radios[0].setAttribute('aria-checked', 'true');
radios[0].tabIndex = 0;
testPageDocument.querySelector('#group_label_1').style.display = 'none';
testPageDocument.querySelector('#beforelink').focus();
