// open "Style/Color" menu item and move focus to the 'Bold' menu item checkbox option
var node = testPageDocument.querySelectorAll('[role=menuitemcheckbox]')[0];
var menuId = testPageDocument.menubarEditor.getMenuId(node)
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
