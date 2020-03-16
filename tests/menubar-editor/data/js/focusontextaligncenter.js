// open "Text ALign" menuitem and move focus to the "Center" menu item checkbox
console.log('[focusOnTextAlignCenter][testPageDocument]: ' + testPageDocument);
testPageDocument.querySelectorAll('[role=menuitem]')[2].setAttribute('aria-expanded', 'true');
testPageDocument.querySelector('[data-option="text-align"]').firstElementChild.nextElementSibling.focus();
