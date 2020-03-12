// open "Size" menu item, disable the "Larger" option and move focus to the "Larger" menu item checkbox option
testPageDocument.querySelectorAll('[role=menuitem]')[3].setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[data-option="font-larger"]').setAttribute('aria-disabled', 'true');
testPageDocument.querySelector('[data-option="font-larger"]').focus();
