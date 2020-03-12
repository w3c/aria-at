// open "Style/Color" menu item and move focue to the 'Black' menu item radio option
testPageDocument.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[data-option="font-color"]').firstElementChild.focus();
