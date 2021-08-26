// Move focus to link before first checkbox and set aria-checked on first checkbox
testPageDocument.querySelector('#beforelink').focus();
testPageDocument.querySelector('[role="checkbox"]').setAttribute('aria-checked', 'true');
