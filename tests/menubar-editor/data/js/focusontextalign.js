// Move focus to the "Text Align" menu item
var node = testPageDocument.querySelectorAll('[role=menuitem]')[2];
var menuId = testPageDocument.menubarEditor.getMenuId(node);
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
