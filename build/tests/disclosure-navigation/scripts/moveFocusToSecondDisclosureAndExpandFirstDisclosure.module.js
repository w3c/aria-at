export function moveFocusToSecondDisclosureAndExpandFirstDisclosure(testPageDocument) {
  // expands the first disclosure button and sets focus on the second disclosure button
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
}
