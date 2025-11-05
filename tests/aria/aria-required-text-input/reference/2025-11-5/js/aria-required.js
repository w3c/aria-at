/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 *
 */

'use strict';

window.addEventListener('load', function () {
  const checkbox = document.getElementById('toggle-required');
  const textInput = document.getElementById('imaginary-word');

  function updateAriaRequired() {
    if (checkbox.checked) {
      textInput.setAttribute('aria-required', 'true');
    } else {
      textInput.setAttribute('aria-required', 'false');
    }
  }

  // Initial state
  updateAriaRequired();

  // Listen for changes
  checkbox.addEventListener('change', updateAriaRequired);
});