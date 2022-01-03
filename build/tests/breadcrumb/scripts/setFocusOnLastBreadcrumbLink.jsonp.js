window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnLastBreadcrumbLink(testPageDocument) {
    // sets focus on the 'Breadcrumb Example' link
    testPageDocument.querySelector('[aria-current="page"]').focus();
  }
});
