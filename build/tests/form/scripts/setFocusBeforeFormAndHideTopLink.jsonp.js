window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeFormAndHideTopLink(testPageDocument) {
    // sets focus on a link before the form landmark, and hides the 'Top' link
    testPageDocument.getElementById('top').setAttribute('hidden', '');
    testPageDocument.getElementById('beforelink').focus();
  }
});
