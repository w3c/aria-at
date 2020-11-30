var scripts = {
	moveFocusBeforeFirstDisclosure: function(testPageDocument){
	// sets focus on a link before the first disclosure button
	testPageDocument.querySelector('#beforelink').focus();
},
	moveFocusToSecondDisclosure: function(testPageDocument){
	// sets focus on the second disclosure button in the navigation region
	testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
},
	moveFocusBeforeFirstDisclosure: function(testPageDocument){
	// sets focus on a link before the first disclosure button
	testPageDocument.querySelector('#beforelink').focus();
},
	moveFocusToSecondDisclosure: function(testPageDocument){
	// sets focus on the second disclosure button in the navigation region
	testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
},
	moveFocusBeforeFirstDisclosure: function(testPageDocument){
	// sets focus on a link before the first disclosure button
	testPageDocument.querySelector('#beforelink').focus();
},
	moveFocusToSecondDisclosure: function(testPageDocument){
	// sets focus on the second disclosure button in the navigation region
	testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
},
	moveFocusBeforeAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on a link before the first disclosure button, and sets the state of the first button to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#beforelink').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusBeforeAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on a link before the first disclosure button, and sets the state of the first button to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#beforelink').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusBeforeAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on a link before the first disclosure button, and sets the state of the first button to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#beforelink').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosure: function(testPageDocument){
	// sets focus on the first disclosure button, and sets its state to expanded
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosureAndSetCurrentPage: function(testPageDocument){
	// sets focus on the first disclosure button, sets its state to expanded, and marks the first link in the associated dropdown as being the current page
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').setAttribute('aria-current', 'page');
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosureAndSetCurrentPage: function(testPageDocument){
	// sets focus on the first disclosure button, sets its state to expanded, and marks the first link in the associated dropdown as being the current page
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').setAttribute('aria-current', 'page');
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToAndExpandFirstDisclosureAndSetCurrentPage: function(testPageDocument){
	// sets focus on the first disclosure button, sets its state to expanded, and marks the first link in the associated dropdown as being the current page
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').setAttribute('aria-current', 'page');
	testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToSecondLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the second link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelectorAll('#id_about_menu a')[1].focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToSecondLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the second link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelectorAll('#id_about_menu a')[1].focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToSecondLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the second link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelectorAll('#id_about_menu a')[1].focus();
},
	moveFocusToSecondLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the second link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelectorAll('#id_about_menu a')[1].focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToSecondLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the second link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelectorAll('#id_about_menu a')[1].focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
},
	moveFocusToFirstLinkInDropdown: function(testPageDocument){
	// sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
	testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
	testPageDocument.querySelector('#id_about_menu a').focus();
}
};