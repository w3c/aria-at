// open "Text ALign" menuitem and move focus to the "Center" menu item checkbox
document.querySelectorAll('role=menuitem')[2].setAttribue('aria-expanded', 'true');
document.querySelector('[data-option="text-align"]').firstElementChild.nextElementSibling.focus();
