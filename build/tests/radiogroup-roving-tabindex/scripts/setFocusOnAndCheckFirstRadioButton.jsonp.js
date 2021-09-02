window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnAndCheckFirstRadioButton(testPageDocument) {
    // sets focus on the first radio button, and sets its state to checked
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
    	r.setAttribute('aria-checked', 'false');
    	r.tabIndex = -1;
    });
    radios[0].setAttribute('aria-checked', 'true');
    radios[0].tabIndex = 0;
    radios[0].focus();
  }
});
