window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToAlaskaInListbox(testPageDocument) {
    // expands the combobox, sets the combobox value to 'Alaska' and places focus on that option in the listbox popup
    testPageDocument.defaultView.comboboxController.open();
    testPageDocument.defaultView.comboboxController.comboboxNode.focus();
    testPageDocument.defaultView.comboboxController.setVisualFocusListbox();
    let opt = testPageDocument.querySelector('#lb1-ak');
    testPageDocument.defaultView.comboboxController.setOption(opt, true);
  }
});
