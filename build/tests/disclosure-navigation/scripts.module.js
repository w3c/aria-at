export function expandFirstDisclosureAndMoveFocusToCampusToursLink(testPageDocument) {
  // expands the first disclosure and sets focus on the 'Campus Tours' link
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.getElementById('campus-tours-link').focus();
}

export function expandFirstDisclosureAndMoveFocusToOverviewLink(testPageDocument) {
  // expands the first disclosure and sets focus on the 'Overview' link
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.querySelector('#id_about_menu a').focus();
}

export function expandFirstDisclosureHideDropdownAndMoveFocusToSecondDisclosure(testPageDocument) {
  // sets the state of the first disclosure button to expanded, hides the associated dropdown and sets focus on the second disclosure
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.getElementById('id_about_menu').style.display = 'none';
  testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
}

export function expandThirdDisclosureHideDropdownAndMoveFocusAfterDisclosure(testPageDocument) {
  // sets the state of the third disclosure button to expanded, hides the associated dropdown and sets focus on the link after the disclosure
  testPageDocument.defaultView.disclosureController.toggleExpand(2, true);
  testPageDocument.getElementById('id_academics_menu').style.display = 'none';
  testPageDocument.getElementById('afterlink').focus();
}

export function moveFocusAfterThirdDisclosure(testPageDocument) {
  // sets focus on a link after the disclosure button
  testPageDocument.querySelector('#afterlink').focus();
}

export function moveFocusBeforeAndExpandFirstDisclosure(testPageDocument) {
  // sets focus on a link before the first disclosure button, and sets the state of the first button to 'expanded'
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.querySelector('#beforelink').focus();
}

export function moveFocusBeforeFirstDisclosure(testPageDocument) {
  // sets focus on a link before the disclosure button
  testPageDocument.querySelector('#beforelink').focus();
}

export function moveFocusToAndExpandFirstDisclosure(testPageDocument) {
  // sets focus on the first disclosure button, and sets its state to expanded
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
}

export function moveFocusToAndExpandFirstDisclosureAndSetCurrentPage(testPageDocument) {
  // sets focus on the first disclosure button, sets its state to expanded, and marks the first link in the associated dropdown as being the current page
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.querySelector('#id_about_menu a').setAttribute('aria-current', 'page');
  testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
}

export function moveFocusToFirstDisclosure(testPageDocument) {
  // sets focus on the first disclosure button
  testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
}

export function moveFocusToSecondDisclosure(testPageDocument) {
  // sets focus on the second disclosure button
  testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
}

export function moveFocusToSecondDisclosureAndExpandFirstDisclosure(testPageDocument) {
  // expands the first disclosure button and sets focus on the second disclosure button
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
}

export function moveFocusToSecondDisclosureAndExpandThirdDisclosure(testPageDocument) {
  // sets the state of the third disclosure button to expanded and sets focus on the second disclosure button
  testPageDocument.defaultView.disclosureController.toggleExpand(2, true);
  testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
}
