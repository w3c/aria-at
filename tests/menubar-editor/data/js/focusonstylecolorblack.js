// open "Style/Color" menu item and move focue to the 'Black' menu item radio option
var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[4];
var menuId = testPageDocument.menubarEditor.getMenuId(node)
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
