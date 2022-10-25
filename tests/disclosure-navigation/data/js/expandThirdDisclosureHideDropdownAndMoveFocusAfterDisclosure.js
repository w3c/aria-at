// sets the state of the third disclosure button to expanded, hides the associated dropdown and sets focus on the link after the disclosure
testPageDocument.defaultView.disclosureController.toggleExpand(2, true);
testPageDocument.getElementById('id_academics_menu').style.display = 'none';
testPageDocument.getElementById('afterlink').focus();
