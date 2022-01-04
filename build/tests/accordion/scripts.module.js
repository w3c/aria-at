export function setFocusBeforeAndCollapseFirstAccordionHeader(testPageDocument) {
  // collapses the 'Personal Information' accordion header, and sets focus on a link before it
  testPageDocument.defaultView.accordions[0].toggle(false);
  testPageDocument.getElementById('beforelink').focus();
}

export function setFocusBeforeFirstAccordionHeader(testPageDocument) {
  // sets focus on a link before the 'Personal Information' accordion header
  testPageDocument.getElementById('beforelink').focus();
}

export function setFocusOnAndCollapseFirstAccordionHeader(testPageDocument) {
  // collapses and sets focus on the 'Personal Information' accordion header
  testPageDocument.defaultView.accordions[0].toggle(false);
  testPageDocument.getElementById('accordion1id').focus();
}

export function setFocusOnFirstAccordionHeader(testPageDocument) {
  // sets focus on the 'Personal Information' accordion header
  testPageDocument.getElementById('accordion1id').focus();
}

export function setFocusOnSecondAccordionHeader(testPageDocument) {
  // sets focus on the 'Billing Address' accordion header
  testPageDocument.getElementById('accordion2id').focus();
}

export function setFocusOnSecondAccordionHeaderAndCollapseFirstAccordionHeader(testPageDocument) {
  // collapses the 'Personal Information' accordion header, and sets focus on the 'Billing Address' accordion header
  testPageDocument.defaultView.accordions[0].toggle(false);
  testPageDocument.getElementById('accordion2id').focus();
}

export function setFocusOnSecondAccordionHeaderAndHideFirstAccordionContent(testPageDocument) {
  // sets focus on the 'Billing Address' accordion header, and hides the content associated with the 'Personal Information' accordion header while leaving it expanded
  testPageDocument.getElementById('sect1').setAttribute('hidden', '');
  testPageDocument.getElementById('accordion2id').focus();
}
