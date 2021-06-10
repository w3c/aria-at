// Move focus to link after first checkbox and set aria-checked on first checkbox
testPageDocument.querySelector('#afterlink').focus();
testPageDocument.querySelector('[role="checkbox"]').setAttribute('aria-checked', 'true');
