window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  checkFirstRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
    // sets the state of the first radio button to checked, and sets focus on a link after the radio group
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
    	r.setAttribute('aria-checked', 'false');
    	r.tabIndex = -1;
    });
    radios[0].setAttribute('aria-checked', 'true');
    radios[0].tabIndex = 0;
    testPageDocument.querySelector('#afterlink').focus();
  },
  checkFirstRadioButtonAndSetFocusBeforeRadioGroup(testPageDocument) {
    // sets the state of the first radio button to checked, sets focus on a link before the radio group, and hides the group heading
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
    	r.setAttribute('aria-checked', 'false');
    	r.tabIndex = -1;
    });
    radios[0].setAttribute('aria-checked', 'true');
    radios[0].tabIndex = 0;
    testPageDocument.querySelector('#group_label_1').style.display = 'none';
    testPageDocument.querySelector('#beforelink').focus();
  },
  checkThirdRadioButtonAndSetFocusAfterRadioGroup(testPageDocument) {
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
  },
  setFocusAfterRadioGroup(testPageDocument) {
    // sets focus on a link after the radio group
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeRadioGroup(testPageDocument) {
    // sets focus on a link before the radio group, and hides the group heading
    testPageDocument.querySelector('#beforelink').focus();
    testPageDocument.querySelector('#group_label_1').style.display = 'none';
  },
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
  },
  setFocusOnFirstRadioButton(testPageDocument) {
    // sets focus on the first radio button
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
    	r.setAttribute('aria-checked', 'false');
    	r.tabIndex = -1;
    });
    radios[0].tabIndex = 0;
    radios[0].focus();
  },
  setFocusOnSecondRadioButton(testPageDocument) {
    // sets focus on the second radio button
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
    	r.setAttribute('aria-checked', 'false');
    	r.tabIndex = -1;
    });
    radios[1].tabIndex = 0;
    radios[1].focus();
  },
  setFocusOnThirdRadioButton(testPageDocument) {
    // sets focus on the third radio button
    let radios = testPageDocument.querySelectorAll('[role="radio"]');
    radios.forEach(r => {
    	r.setAttribute('aria-checked', 'false');
    	r.tabIndex = -1;
    });
    let lastRadio = radios[radios.length - 1];
    lastRadio.tabIndex = 0;
    lastRadio.focus();
  }
});
