// sets focus on the 'Lettuce' checkbox, and sets its state to 'checked'
testPageDocument.querySelector('[role="checkbox"]').setAttribute('aria-checked', 'true');
testPageDocument.querySelector('[role="checkbox"]').focus();
