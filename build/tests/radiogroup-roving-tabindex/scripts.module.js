export function checkFirstRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
  // sets the state of the first radio button to checked, and sets focus on a link after the radio group
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].setAttribute('tabindex', '0');
  radios[0].setAttribute('aria-checked', 'true');
  testPageDocument.querySelector('#afterlink').focus();
}

export function checkFirstRadioButtonAndSetFocusBeforeRadioGroup(testPageDocument) {
  // sets the state of the first radio button to checked, and sets focus on a link before the radio group
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].setAttribute('tabindex', '0');
  radios[0].setAttribute('aria-checked', 'true');
  testPageDocument.querySelector('#beforelink').focus();
}

export function checkThirdRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
  // sets the state of the third radio button to checked, and sets focus on a link after the radio group
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[2].setAttribute('tabindex', '0');
  radios[2].setAttribute('aria-checked', 'true');
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusAfterRadioGroup(testPageDocument) {
  // sets focus on a link after the radio group
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeRadioGroup(testPageDocument) {
  // sets focus on a link before the radio group
  testPageDocument.querySelector('#beforelink').focus();
}

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

export function setFocusOnFirstRadioButton(testPageDocument) {
  // sets focus on the first radio button
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radios[0].setAttribute('tabindex', '0');
  radios[0].focus();
}

export function setFocusOnFirstRadioButtonAndCheckSecondRadioButton(testPageDocument) {
  // sets focus on the first radio button, and checks the  second radio button
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[0].classList.add('focus');
  radios[0].setAttribute('tabindex', '0');
  radios[1].setAttribute('aria-checked', 'true');
  radios[0].focus();
}

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

export function setFocusOnSecondRadioButtonAndCheckFirstRadioButton(testPageDocument) {
  // sets focus on the second radio button, and checks the first radio button
  let radios = testPageDocument.querySelectorAll('[role="radio"]');
  radios.forEach(r => {
    r.setAttribute('tabindex', '-1');
    r.setAttribute('aria-checked', 'false');
    r.classList.remove('focus');
  });
  radios[1].classList.add('focus');
  radios[1].setAttribute('tabindex', '0');
  radios[0].setAttribute('aria-checked', 'true');
  radios[1].focus();
}

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
