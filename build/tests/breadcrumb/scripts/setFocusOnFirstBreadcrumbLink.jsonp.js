window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnFirstBreadcrumbLink(testPageDocument) {
    // sets focus on the 'WAI-ARIA Authoring Practices' link
    testPageDocument.getElementById('breadcrumb1').focus();
  }
});
