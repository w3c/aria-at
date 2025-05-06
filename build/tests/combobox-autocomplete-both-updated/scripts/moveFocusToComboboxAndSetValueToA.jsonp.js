window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToComboboxAndSetValueToA(testPageDocument) {
    // sets focus on the combobox, and sets the combobox value to 'a'
    testPageDocument.defaultView.comboboxController.setValue('a');
    testPageDocument.defaultView.comboboxController.comboboxNode.select();
    testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  }
});
