// open "Size" menu item, disable the "Larger" option and move focus to the "Larger" menu item checkbox option
testPageDocument.querySelectorAll('[role=menuitem]')[5].setAttribute('aria-disabled', 'true');
testPageDocument.querySelectorAll('[role=menuitem]')[3].focus();

