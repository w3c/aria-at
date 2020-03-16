// Open "Font" menu item and move focus to the "Font" menu item
console.log('[openFontSubMenu][testPageDocument]: ' + testPageDocument);
testPageDocument.querySelector('[role=menuitem]').setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[role=menuitem]').focus();
