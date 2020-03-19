// Move focus to the "Style/Color" menu item
var node = testPageDocument.querySelectorAll('[role=menuitem]')[1];
var menuId = testPageDocument.menubarEditor.getMenuId(node);
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
