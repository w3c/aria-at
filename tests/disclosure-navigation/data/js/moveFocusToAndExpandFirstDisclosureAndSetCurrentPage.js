// sets focus on the first disclosure button, sets its state to expanded, and marks the first link in the associated dropdown as being the current page
testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
testPageDocument.querySelector('#id_about_menu a').setAttribute('aria-current', 'page');
testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
