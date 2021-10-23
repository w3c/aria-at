window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSliderAndSetValueToOne(testPageDocument) {
    // sets focus on the slider, and sets its value to one star
    let slider = testPageDocument.querySelector('[role="slider"]');
    slider.setAttribute('aria-valuenow', '1');
    slider.setAttribute('aria-valuetext', 'one of five stars');
    slider.focus();
  }
});
