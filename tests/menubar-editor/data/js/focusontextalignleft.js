// open "Text Align" menu item and move focus to the 'Left' menu item checkbox option
document.querySelectorAll('role=menuitem')[2].setAttribue('aria-expanded', 'true');
document.querySelector('[data-option="text-align"]').firstElementChild.focus();
