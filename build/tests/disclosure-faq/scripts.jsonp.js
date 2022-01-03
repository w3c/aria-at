window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusAfterAndExpandFirstDisclosure(testPageDocument) {
    // sets the state of the first disclosure button to expanded, and sets focus on a link after the button
    const btn = testPageDocument.querySelector('button[aria-controls="faq1_desc"]');
    const answer = testPageDocument.querySelector('#faq1_desc');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.display = 'block';
    testPageDocument.querySelector('#afterlink').focus();
  },
  moveFocusAfterFirstDisclosure(testPageDocument) {
    // sets focus on a link after the first disclosure button
    testPageDocument.querySelector('#afterlink').focus();
  },
  moveFocusBeforeAndExpandFirstDisclosure(testPageDocument) {
    // sets focus on a link before the first disclosure button, and sets the state of the first button to expanded
    const btn = testPageDocument.querySelector('button[aria-controls="faq1_desc"]');
    const answer = testPageDocument.querySelector('#faq1_desc');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.display = 'block';
    testPageDocument.querySelector('#beforelink').focus();
  },
  moveFocusBeforeFirstDisclosure(testPageDocument) {
    // sets focus on a link before the first disclosure button
    testPageDocument.querySelector('#beforelink').focus();
  },
  moveFocusToAndExpandFirstDisclosure(testPageDocument) {
    // sets focus on the first disclosure button, and sets its state to expanded
    const btn = testPageDocument.querySelector('button[aria-controls="faq1_desc"]');
    const answer = testPageDocument.querySelector('#faq1_desc');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.display = 'block';
    // Hide the link after the button so it doesn't get in the way
    testPageDocument.querySelector('#afterlink').style.display = 'none';
    btn.focus();
  },
  moveFocusToFirstDisclosure(testPageDocument) {
    // sets focus on the first disclosure button
    testPageDocument.querySelector('button[aria-controls="faq1_desc"]').focus();
  }
});
