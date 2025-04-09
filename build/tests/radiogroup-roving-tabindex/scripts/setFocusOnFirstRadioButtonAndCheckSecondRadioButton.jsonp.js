window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnFirstRadioButtonAndCheckSecondRadioButton(testPageDocument) {
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
});
