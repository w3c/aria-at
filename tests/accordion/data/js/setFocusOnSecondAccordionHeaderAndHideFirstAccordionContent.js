// sets focus on the 'Billing Address' accordion header, and hides the content associated with the 'Personal Information' accordion header while expanding it
testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
testPageDocument.querySelector('button[aria-controls="sect2"]').focus();
