window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusAfterLastBreadcrumbLink(testPageDocument) {
    // sets focus on a link after the 'Breadcrumb Example' link
    testPageDocument.querySelector('#afterlink').focus();
  }
});
