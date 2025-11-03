// sets focus on a link before the checkbox, and sets the state of the checkbox to 'checked'
testPageDocument.querySelector('[role="checkbox"]').setAttribute('aria-checked', 'true');
testPageDocument.getElementById('beforelink').focus();
