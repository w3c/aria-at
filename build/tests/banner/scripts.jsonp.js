window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterBanner(testPageDocument) {
    // sets focus on a link after the banner landmark
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusAfterBannerAndHideBottomLink(testPageDocument) {
    // sets focus on a link after the banner landmark, and hides the last link inside the landmark region
    testPageDocument.getElementById('bottom').setAttribute('hidden', '');
    testPageDocument.getElementById('afterlink').focus();
  },
  setFocusBeforeBanner(testPageDocument) {
    // sets focus on a link before the banner landmark
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusBeforeBannerAndHideTopLink(testPageDocument) {
    // sets focus on a link before the banner landmark, and hides the first link inside the landmark region
    testPageDocument.getElementById('top').setAttribute('hidden', '');
    testPageDocument.getElementById('beforelink').focus();
  },
  setFocusOnBottomLink(testPageDocument) {
    // sets focus on the 'Bottom' link
    testPageDocument.getElementById('bottom').focus();
  },
  setFocusOnTopLink(testPageDocument) {
    // sets focus on the 'Top' link
    testPageDocument.getElementById('top').focus();
  }
});
