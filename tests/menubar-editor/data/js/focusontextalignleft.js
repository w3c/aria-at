// open "Text Align" menu item and move focus to the 'Left' menu item checkbox option
var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[12];
var menuId = testPageDocument.menubarEditor.getMenuId(node);
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
