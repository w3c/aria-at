window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusAfterCombobox(testPageDocument) {
    // sets focus on a link after the Combobox
    testPageDocument.querySelector('#afterlink').focus();
  },
  moveFocusBeforeCombobox(testPageDocument) {
    // sets focus on a link before the Combobox
    testPageDocument.querySelector('#beforelink').focus();
  },
  moveFocusToCombobox(testPageDocument) {
    // sets focus on the combobox
    testPageDocument.querySelector('[role="combobox"]').focus();
  },
  openListbox(testPageDocument) {
    // sets focus on and expands the Combobox
    testPageDocument.querySelector('[role="combobox"]').focus();
    testPageDocument.defaultView.selectController.updateMenuState(true);
  },
  openListboxToApple(testPageDocument) {
    // sets focus on and expands the Combobox, and sets the focused option to 'Apple'
    testPageDocument.querySelector('[role="combobox"]').focus();
    testPageDocument.defaultView.selectController.updateMenuState(true);
    testPageDocument.defaultView.selectController.onOptionChange(1);
  },
  openListboxToGuava(testPageDocument) {
    // sets focus on and expands the Combobox, and sets the focused option to 'Guave'
    testPageDocument.querySelector('[role="combobox"]').focus();
    testPageDocument.defaultView.selectController.updateMenuState(true);
    testPageDocument.defaultView.selectController.onOptionChange(11);
  },
  openListboxToHuckleberry(testPageDocument) {
    // sets focus on and expands the Combobox, and sets the focused option to 'Huckleberry'
    testPageDocument.querySelector('[role="combobox"]').focus();
    testPageDocument.defaultView.selectController.updateMenuState(true);
    testPageDocument.defaultView.selectController.onOptionChange(12);
  }
});
