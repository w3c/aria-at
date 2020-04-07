// Set aria-checked on first checkbox
const checkboxes = testPageDocument.querySelectorAll('[role="checkbox"]');
checkboxes[0].setAttribute('aria-checked', 'true');