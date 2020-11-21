// sets focus on and expands the Combobox, and sets the focused option to 'Apple'
testPageDocument.querySelector('[role="combobox"]').focus();
window.selectController.updateMenuState(true);
window.selectController.onOptionChange(1);
