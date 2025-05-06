window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnFirstRadioButtonAndCheckSecondRadioButton(testPageDocument) {
    // sets focus on the first radio button, and checks the  second radio button
    let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
      r.setAttribute('aria-checked', 'false');
      r.classList.remove('focus');
    });
    radios[0].classList.add('focus');
    radios[1].setAttribute('aria-checked', 'true');
    radioGroup.setAttribute('aria-activedescendant', radios[0].id);
    radioGroup.focus();
  }
});
