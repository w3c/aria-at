// sets focus on a link after the checkbox, and sets the checkbox state to 'checked'
testPageDocument.querySelector('[role="checkbox"]').setAttribute('aria-checked', 'true');
testPageDocument.getElementById('afterlink').focus();
