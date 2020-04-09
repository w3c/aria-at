// Move focus and set aria-checked on first checkbox
const checkbox = testPageDocument.querySelector('[role="checkbox"]');
checkbox.focus();
checkbox.setAttribute('aria-checked', 'true');
