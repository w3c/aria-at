// open "Style/Color" menu item and move focus to the 'Blue' menu item radio option
document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
document.querySelector('[data-option="font-color"]').firstElementChild.nextElementSibling.focus();
