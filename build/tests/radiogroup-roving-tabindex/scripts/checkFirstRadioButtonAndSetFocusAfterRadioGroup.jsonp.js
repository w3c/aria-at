window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  checkFirstRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
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
});
