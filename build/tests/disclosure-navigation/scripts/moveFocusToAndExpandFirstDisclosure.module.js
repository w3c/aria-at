export function moveFocusToAndExpandFirstDisclosure(testPageDocument) {
  // sets focus on the first disclosure button, and sets its state to expanded
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.querySelector('button[aria-controls="id_about_menu"]').focus();
}
