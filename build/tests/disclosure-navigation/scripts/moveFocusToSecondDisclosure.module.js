export function moveFocusToSecondDisclosure(testPageDocument) {
  // sets focus on the second disclosure button
  testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
}
