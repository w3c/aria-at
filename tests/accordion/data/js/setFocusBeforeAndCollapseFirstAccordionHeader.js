// collapses the 'Personal Information' accordion header, and sets focus on a link before it
testPageDocument.defaultView.accordions[0].toggle(false);
testPageDocument.getElementById('beforelink').focus();
