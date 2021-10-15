window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusAfterComboboxAndSetValueToAlabama(testPageDocument) {
    // sets focus on a link after the Combobox, and sets the combobox value to 'Alabama'
    testPageDocument.querySelector('#cb1-button').style.display = 'none';
    testPageDocument.defaultView.comboboxController.setValue('Alabama');
    testPageDocument.querySelector('#afterlink').focus();
  }
});
