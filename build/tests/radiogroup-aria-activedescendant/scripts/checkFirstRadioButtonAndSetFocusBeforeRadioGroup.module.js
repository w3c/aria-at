export function checkFirstRadioButtonAndSetFocusBeforeRadioGroup(testPageDocument) {
  // sets the state of the first radio button to checked, sets focus on a link before the radio group, and hides the group heading
  let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
  	r.setAttribute('aria-checked', 'false');
  	r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radios[0].setAttribute('aria-checked', 'true');
  radioGroup.setAttribute('aria-activedescendant', radios[0].id);
  testPageDocument.querySelector('#beforelink').focus();
  testPageDocument.querySelector('#group_label_1').style.display = 'none';
}
