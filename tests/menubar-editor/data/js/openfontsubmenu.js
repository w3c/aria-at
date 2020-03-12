// Open "Font" menu item and move focus to the "Font" menu item
testPageDocument.querySelector('[role=menuitem]').setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[role=menuitem]').focus();
