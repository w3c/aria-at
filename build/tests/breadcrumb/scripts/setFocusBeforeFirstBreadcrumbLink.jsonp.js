window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeFirstBreadcrumbLink(testPageDocument) {
    // sets focus on a link before the 'WAI-ARIA Authoring Practices' link
    testPageDocument.querySelector('#beforelink').focus();
  }
});
