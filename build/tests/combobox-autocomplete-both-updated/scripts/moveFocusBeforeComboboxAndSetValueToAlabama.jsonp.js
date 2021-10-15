window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusBeforeComboboxAndSetValueToAlabama(testPageDocument) {
    // sets focus on a link before the Combobox, and sets the combobox value to 'Alabama'
    testPageDocument.defaultView.comboboxController.setValue('Alabama');
    testPageDocument.querySelector('#beforelink').focus();
  }
});
