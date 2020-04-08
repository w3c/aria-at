// Move focus to the "Size" menu item
var node = testPageDocument.querySelectorAll('[role=menuitem]')[3];
var menuId = testPageDocument.menubarEditor.getMenuId(node);
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);

