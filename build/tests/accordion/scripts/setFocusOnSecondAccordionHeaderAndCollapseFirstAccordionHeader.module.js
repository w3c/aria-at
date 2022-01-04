export function setFocusOnSecondAccordionHeaderAndCollapseFirstAccordionHeader(testPageDocument) {
  // collapses the 'Personal Information' accordion header, and sets focus on the 'Billing Address' accordion header
  testPageDocument.defaultView.accordions[0].toggle(false);
  testPageDocument.getElementById('accordion2id').focus();
}
