// open "Style/Color" menu item and move focus to the 'Blue' menu item radio option
console.log('[focusOnStyleColorBlue][testPageDocument]: ' + testPageDocument);
testPageDocument.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[data-option="font-color"]').firstElementChild.nextElementSibling.focus();
