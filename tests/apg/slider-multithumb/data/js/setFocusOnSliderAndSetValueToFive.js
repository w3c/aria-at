// sets focus on the slider, and sets its value to five stars
let slider = testPageDocument.querySelector('[role="slider"]');
slider.setAttribute('aria-valuenow', '5');
slider.setAttribute('aria-valuetext', 'five of five stars');
slider.focus();
