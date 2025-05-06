window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSecondRadioButtonAndCheckFirstRadioButton(testPageDocument) {
    // sets focus on the second radio button, and checks the first radio button
    let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
      r.setAttribute('aria-checked', 'false');
      r.classList.remove('focus');
    });
    radios[1].classList.add('focus');
    radios[0].setAttribute('aria-checked', 'true');
    radioGroup.setAttribute('aria-activedescendant', radios[1].id);
    radioGroup.focus();
  }
});
