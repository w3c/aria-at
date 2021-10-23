window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterSlider(testPageDocument) {
    // sets focus on a link after the slider
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeSlider(testPageDocument) {
    // sets focus on a link before the slider
    testPageDocument.querySelector('#beforelink').focus();
  },
  setFocusOnSlider(testPageDocument) {
    // sets focus on the slider
    testPageDocument.querySelector('[role="slider"]').focus();
  },
  setFocusOnSliderAndSetValueToFive(testPageDocument) {
    // sets focus on the slider, and sets its value to five stars
    let slider = testPageDocument.querySelector('[role="slider"]');
    slider.setAttribute('aria-valuenow', '5');
    slider.setAttribute('aria-valuetext', 'five stars');
    slider.focus();
  },
  setFocusOnSliderAndSetValueToOne(testPageDocument) {
    // sets focus on the slider, and sets its value to one star
    let slider = testPageDocument.querySelector('[role="slider"]');
    slider.setAttribute('aria-valuenow', '1');
    slider.setAttribute('aria-valuetext', 'one star');
    slider.focus();
  },
  setFocusOnSliderAndSetValueToOneHalfStar(testPageDocument) {
    // sets focus on the slider, and sets its value to one half star
    let slider = testPageDocument.querySelector('[role="slider"]');
    slider.setAttribute('aria-valuenow', '0.5');
    slider.setAttribute('aria-valuetext', 'one half star');
    slider.focus();
  }
});
