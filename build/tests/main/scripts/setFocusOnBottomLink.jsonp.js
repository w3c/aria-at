window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnBottomLink(testPageDocument) {
    // sets focus on the 'Bottom' link
    testPageDocument.querySelector('.button-run-test-setup').parentElement.style.display = 'none';
    testPageDocument.getElementById('bottom').focus();
  }
});
