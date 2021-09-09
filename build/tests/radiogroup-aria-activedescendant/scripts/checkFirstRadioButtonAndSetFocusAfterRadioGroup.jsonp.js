window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  checkFirstRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
    // sets the state of the first radio button to checked, and sets focus on a link after the radio group
    let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
    	r.setAttribute('aria-checked', 'false');
    	r.classList.remove('focus');
    });
    radios[0].classList.add('focus');
    radios[0].setAttribute('aria-checked', 'true');
    radioGroup.setAttribute('aria-activedescendant', radios[0].id);
    testPageDocument.querySelector('#afterlink').focus();
  }
});
