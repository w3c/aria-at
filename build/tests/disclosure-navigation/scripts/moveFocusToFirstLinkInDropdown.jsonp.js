window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToFirstLinkInDropdown(testPageDocument) {
    // sets the state of the first disclosure button to expanded, and sets focus on the first link of the associated dropdown
    testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
    testPageDocument.querySelector('#id_about_menu a').focus();
  }
});
