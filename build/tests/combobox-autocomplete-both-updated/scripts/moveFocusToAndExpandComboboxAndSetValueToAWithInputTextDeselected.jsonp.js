window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToAndExpandComboboxAndSetValueToAWithInputTextDeselected(testPageDocument) {
    // sets focus on and expands the combobox, sets the combobox value to 'a', and de-selects all text in the input
    testPageDocument.defaultView.comboboxController.setValue('a');
    testPageDocument.defaultView.comboboxController.open();
    testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  }
});
