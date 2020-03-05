// open "Size" menu item, disable the "Larger" option and move focus to the "Larger" menu item checkbox option
document.querySelectorAll('[role=menuitem]')[3].setAttribute('aria-expanded', 'true');
document.querySelector('[data-option="font-larger"]').setAttribute('aria-disabled', 'true');
document.querySelector('[data-option="font-larger"]').focus();
