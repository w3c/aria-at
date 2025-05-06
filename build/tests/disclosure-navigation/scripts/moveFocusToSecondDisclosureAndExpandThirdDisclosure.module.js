export function moveFocusToSecondDisclosureAndExpandThirdDisclosure(testPageDocument) {
  // sets the state of the third disclosure button to expanded and sets focus on the second disclosure button
  testPageDocument.defaultView.disclosureController.toggleExpand(2, true);
  testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
}
