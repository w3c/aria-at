// Move focus and set aria-pressed on second button
const button = testPageDocument.querySelectorAll('[role="button"]')[1];
button.focus();
button.setAttribute('aria-pressed', 'true');
