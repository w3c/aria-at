window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnButtonAndSetStateToPressed(testPageDocument) {
    // sets focus on the button, and sets its state to 'pressed'
    let button = testPageDocument.querySelector('#toggle');
    button.setAttribute('aria-pressed', 'true');
    button.querySelector('use').setAttribute('xlink:href', '#icon-sound');
    button.focus();
  }
});
