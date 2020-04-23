var scripts = {
	focusonfirstlink: function(testPageDocument){
	// Move focus to the link just before the meunbar
	console.log('[focusOnFirstLink][menubarEditor]: ' + testPageDocument.menubarEditor);
	testPageDocument.querySelector('a').focus();
},
	focusonfirstlink: function(testPageDocument){
	// Move focus to the link just before the meunbar
	console.log('[focusOnFirstLink][menubarEditor]: ' + testPageDocument.menubarEditor);
	testPageDocument.querySelector('a').focus();
},
	focusonfont: function(testPageDocument){
	// Move focus to the "Font" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[0];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonfont: function(testPageDocument){
	// Move focus to the "Font" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[0];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	openfontsubmenu: function(testPageDocument){
	// Open "Font" menu item and move focus to the "Font" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[0];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
	testPageDocument.menubarEditor.openPopup(node);
},
	focusonfont: function(testPageDocument){
	// Move focus to the "Font" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[0];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecolor: function(testPageDocument){
	// Move focus to the "Style/Color" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[1];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecolor: function(testPageDocument){
	// Move focus to the "Style/Color" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[1];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecolorblue: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Blue' menu item radio option
	var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[5];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecolorblue: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Blue' menu item radio option
	var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[5];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecoloritalic: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Italic' menu item checkbox option
	var node = testPageDocument.querySelectorAll('[role=menuitemcheckbox]')[1];
	var menuId = testPageDocument.menubarEditor.getMenuId(node)
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecoloritalic: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Italic' menu item checkbox option
	var node = testPageDocument.querySelectorAll('[role=menuitemcheckbox]')[1];
	var menuId = testPageDocument.menubarEditor.getMenuId(node)
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecoloritalicchecked: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Italic' menu item checkbox option
	var node = testPageDocument.querySelectorAll('[role=menuitemcheckbox]')[1];
	var menuId = testPageDocument.menubarEditor.getMenuId(node)
	testPageDocument.menubarEditor.toggleCheckbox(node)
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecoloritalicchecked: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Italic' menu item checkbox option
	var node = testPageDocument.querySelectorAll('[role=menuitemcheckbox]')[1];
	var menuId = testPageDocument.menubarEditor.getMenuId(node)
	testPageDocument.menubarEditor.toggleCheckbox(node)
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusontextalign: function(testPageDocument){
	// Move focus to the "Text Align" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[2];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusontextalign: function(testPageDocument){
	// Move focus to the "Text Align" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[2];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusontextalignleft: function(testPageDocument){
	// open "Text Align" menu item and move focus to the 'Left' menu item checkbox option
	var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[12];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusontextalignleft: function(testPageDocument){
	// open "Text Align" menu item and move focus to the 'Left' menu item checkbox option
	var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[12];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonsize: function(testPageDocument){
	// Move focus to the "Size" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[3];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonsize: function(testPageDocument){
	// Move focus to the "Size" menu item
	var node = testPageDocument.querySelectorAll('[role=menuitem]')[3];
	var menuId = testPageDocument.menubarEditor.getMenuId(node);
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecolorblack: function(testPageDocument){
	// open "Style/Color" menu item and move focue to the 'Black' menu item radio option
	var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[4];
	var menuId = testPageDocument.menubarEditor.getMenuId(node)
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecolorblack: function(testPageDocument){
	// open "Style/Color" menu item and move focue to the 'Black' menu item radio option
	var node = testPageDocument.querySelectorAll('[role=menuitemradio]')[4];
	var menuId = testPageDocument.menubarEditor.getMenuId(node)
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecolorbold: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Bold' menu item checkbox option
	var node = testPageDocument.querySelectorAll('[role=menuitemcheckbox]')[0];
	var menuId = testPageDocument.menubarEditor.getMenuId(node)
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonstylecolorbold: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Bold' menu item checkbox option
	var node = testPageDocument.querySelectorAll('[role=menuitemcheckbox]')[0];
	var menuId = testPageDocument.menubarEditor.getMenuId(node)
	testPageDocument.menubarEditor.setFocusToMenuitem(menuId, node);
},
	focusonsizelargerdisabled: function(testPageDocument){
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
},
	focusonsizelargerdisabled: function(testPageDocument){
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
}
};