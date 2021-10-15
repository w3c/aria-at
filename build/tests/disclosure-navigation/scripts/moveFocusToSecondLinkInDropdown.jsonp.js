window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToSecondLinkInDropdown(testPageDocument) {
    // sets the state of the first disclosure button to expanded, and sets focus on the second link of the associated dropdown
    testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
    testPageDocument.querySelectorAll('#id_about_menu a')[1].focus();
  }
});
