export function setFocusAfterLastBreadcrumbLink(testPageDocument) {
  // sets focus on a link after the 'Breadcrumb Example' link
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeFirstBreadcrumbLink(testPageDocument) {
  // sets focus on a link before the 'WAI-ARIA Authoring Practices' link
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusOnFirstBreadcrumbLink(testPageDocument) {
  // sets focus on the 'WAI-ARIA Authoring Practices' link
  testPageDocument.getElementById('breadcrumb1').focus();
}

export function setFocusOnLastBreadcrumbLink(testPageDocument) {
  // sets focus on the 'Breadcrumb Example' link
  testPageDocument.querySelector('[aria-current="page"]').focus();
}
