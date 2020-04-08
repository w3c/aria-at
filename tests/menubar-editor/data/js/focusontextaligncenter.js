// open "Text ALign" menuitem and move focus to the "Center" menu item checkbox
var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[13];
var menuId = testPageDocument.menubarEditor.getMenuId(node);
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
