// open "Style/Color" menu item and move focus to the 'Bold' menu item checkbox option
testPageDocument.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[data-option="bold"]').focus();
