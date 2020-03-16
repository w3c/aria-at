// open "Style/Color" menu item and move focue to the 'Black' menu item radio option
console.log('[focusOnStyleColorBlack][testPageDocument]: ' + testPageDocument);
var nodes = testPageDocument.querySelectorAll('[role=menuitem]');
console.log('[textContent]: ' + nodes[1].textContent);
console.log('[aria-expanded]: ' + nodes[1].getAttribute('aria-expanded'));
nodes[1].setAttribute('aria-expanded', 'true');
console.log('[aria-expanded]: ' + nodes[1].getAttribute('aria-expanded'));

/*
[1].setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[data-option="font-color"]').firstElementChild.focus();
*/
