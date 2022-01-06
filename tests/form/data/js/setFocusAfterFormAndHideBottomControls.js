// sets focus on a link after the form landmark, and hides the 'Bottom' link and 'Add Contact' button
testPageDocument.querySelector('[type="submit"]').style.display = 'none';
testPageDocument.getElementById('bottom').setAttribute('hidden', '');
testPageDocument.getElementById('afterlink').focus();
