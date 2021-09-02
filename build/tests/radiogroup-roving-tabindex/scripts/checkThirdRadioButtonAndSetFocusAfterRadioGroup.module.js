export function checkThirdRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
  // sets the state of the third radio button to checked, and sets focus on a link after the radio group
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
  	r.setAttribute('aria-checked', 'false');
  	r.tabIndex = -1;
  });
  let lastRadio = radios[radios.length - 1];
  lastRadio.setAttribute('aria-checked', 'true');
  lastRadio.tabIndex = 0;
  testPageDocument.querySelector('#afterlink').focus();
}
