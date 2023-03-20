// expands the first disclosure and sets focus on the 'Campus Tours' link
testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
testPageDocument.getElementById('campus-tours-link').focus();
