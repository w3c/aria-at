// sets the state of the first disclosure button to expanded and sets focus on the second disclosure
testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
