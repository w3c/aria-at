// open "Style/Color" menu item and move focus to the 'Blue' menu item radio option
var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[5];
var menuId = testPageDocument.menubarEditor.getMenuId(node);
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
