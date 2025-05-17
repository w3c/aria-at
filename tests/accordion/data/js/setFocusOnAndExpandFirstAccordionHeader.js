// sets focus on, and expands  the 'Personal Information' accordion header
testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
testPageDocument.querySelector('button[aria-controls="sect1"]').focus();
