window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterLastBreadcrumbLink(testPageDocument) {
    // sets focus on a link after the 'Breadcrumb Example' link
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeFirstBreadcrumbLink(testPageDocument) {
    // sets focus on a link before the 'WAI-ARIA Authoring Practices' link
    testPageDocument.querySelector('#beforelink').focus();
  },
  setFocusOnLastBreadcrumbLink(testPageDocument) {
    // sets focus on the 'Breadcrumb Example' link
    testPageDocument.querySelector('[aria-current="page"]').focus();
  }
});
