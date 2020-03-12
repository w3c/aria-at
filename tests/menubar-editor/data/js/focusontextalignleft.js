// open "Text Align" menu item and move focus to the 'Left' menu item checkbox option
testPageDocument.querySelectorAll('[role=menuitem]')[2].setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[data-option="text-align"]').firstElementChild.focus();
