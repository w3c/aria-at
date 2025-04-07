window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToAndExpandFirstDisclosure(testPageDocument) {
    // sets focus on the first disclosure button, and sets its state to expanded
    const btn = testPageDocument.querySelector('button[aria-controls="faq1_desc"]');
    const answer = testPageDocument.querySelector('#faq1_desc');
    btn.setAttribute('aria-expanded', 'true');
    answer.style.display = 'block';
    // Hide the link after the button so it doesn't get in the way
    testPageDocument.querySelector('#afterlink').style.display = 'none';
    btn.focus();
  }
});
