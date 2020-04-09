// Open "Font" menu item and move focus to the "Font" menu item
var node = testPageDocument.querySelectorAll('[role=menuitem]')[0];
var menuId = testPageDocument.menubarEditor.getMenuId(node);
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
testPageDocument.menubarEditor.openPopup(node);

