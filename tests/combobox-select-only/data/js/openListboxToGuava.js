// sets focus on and expands the Combobox, and sets the focused option to 'Guave'
testPageDocument.querySelector('[role="combobox"]').focus();
testPageDocument.defaultView.selectController.updateMenuState(true);
testPageDocument.defaultView.selectController.onOptionChange(11);
