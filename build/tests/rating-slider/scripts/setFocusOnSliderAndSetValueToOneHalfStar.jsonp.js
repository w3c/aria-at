window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSliderAndSetValueToOneHalfStar(testPageDocument) {
    // sets focus on the slider, and sets its value to one half star
    let slider = testPageDocument.querySelector('[role="slider"]');
    slider.setAttribute('aria-valuenow', '0.5');
    slider.setAttribute('aria-valuetext', 'one half star');
    slider.focus();
  }
});
