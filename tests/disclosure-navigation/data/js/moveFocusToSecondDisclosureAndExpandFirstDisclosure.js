// sets focus on the second disclosure button in the navigation region, and sets the state of the first button to expanded without displaying its associated list of links
testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
let firstMenu = testPageDocument.querySelector('#id_about_menu');
firstMenu.style.display = 'none';
testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
