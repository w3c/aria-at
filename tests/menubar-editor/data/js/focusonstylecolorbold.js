// open "Style/Color" menu item and move focus to the 'Bold' menu item checkbox option
document.querySelectorAll('role=menuitem')[1].setAttribue('aria-expanded', 'true');
document.querySelector('[data-option="bold"]').focus();
