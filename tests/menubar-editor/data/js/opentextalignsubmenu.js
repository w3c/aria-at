// open "Text Align" menuitem and give the "Text Align" menu item focus
var node = testPageDocument.querySelectorAll('[role=menuitem]')[2];
var menuId = testPageDocument.menubarEditor.getMenuId(node);
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
testPageDocument.menubarEditor.openPopup(node);
