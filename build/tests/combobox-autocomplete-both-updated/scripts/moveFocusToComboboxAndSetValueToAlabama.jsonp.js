window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToComboboxAndSetValueToAlabama(testPageDocument) {
    // sets focus on the combobox, and sets the combobox value to 'Alabama'
    testPageDocument.defaultView.comboboxController.setValue('Alabama');
    testPageDocument.defaultView.comboboxController.comboboxNode.select();
    testPageDocument.defaultView.comboboxController.comboboxNode.focus();
  }
});
