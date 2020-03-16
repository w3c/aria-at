// open "Text Align" menu item and move focus to the 'Left' menu item checkbox option
console.log('[focusOnTextAlignLeft][testPageDocument]: ' + testPageDocument);
testPageDocument.querySelectorAll('[role=menuitem]')[2].setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[data-option="text-align"]').firstElementChild.focus();
