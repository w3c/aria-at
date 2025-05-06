export function expandFirstDisclosureAndMoveFocusToOverviewLink(testPageDocument) {
  // expands the first disclosure and sets focus on the 'Overview' link
  testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
  testPageDocument.querySelector('#id_about_menu a').focus();
}
