// sets focus on a link before the first disclosure button, and sets the state of the first button to 'expanded'
testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
testPageDocument.querySelector('#beforelink').focus();
