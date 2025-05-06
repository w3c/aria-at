window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  expandFirstDisclosureHideDropdownAndMoveFocusToSecondDisclosure(testPageDocument) {
    // sets the state of the first disclosure button to expanded, hides the associated dropdown and sets focus on the second disclosure
    testPageDocument.defaultView.disclosureController.toggleExpand(0, true);
    testPageDocument.getElementById('id_about_menu').style.display = 'none';
    testPageDocument.querySelector('button[aria-controls="id_admissions_menu"]').focus();
  }
});
