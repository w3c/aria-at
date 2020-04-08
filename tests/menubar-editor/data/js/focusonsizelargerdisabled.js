// open "Size" menu item, disable the "Larger" option and move focus to the "Larger" menu item checkbox option
var nodes = testPageDocument.querySelectorAll('[role=menuitemradio]');
var node = nodes[nodes.length-1];  // get last radio button, x-large
console.log(node.textContent);
var menuId = testPageDocument.menubarEditor.getMenuId(node);
var option = testPageDocument.menubarEditor.getDataOption(node);
var value = testPageDocument.menubarEditor.setRadioButton(node);
testPageDocument.menubarEditor.actionManager.setOption(option, value);
testPageDocument.menubarEditor.updateFontSizeMenu('menu-size');

node = testPageDocument.querySelectorAll('[role=menuitem]')[5];
testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);

