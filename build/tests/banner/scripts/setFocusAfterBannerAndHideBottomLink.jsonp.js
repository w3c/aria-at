window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterBannerAndHideBottomLink(testPageDocument) {
    // sets focus on a link after the banner landmark, and hides the last link inside the landmark region
    testPageDocument.getElementById('bottom').setAttribute('hidden', '');
    testPageDocument.getElementById('afterlink').focus();
  }
});
