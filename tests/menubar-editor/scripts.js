var scripts = {
	focusonfirstlink: function(testPageDocument){
	// Move focus to the link just before the meunbar
	document.querySelector('a').focus();
},
	focusonfirstlink: function(testPageDocument){
	// Move focus to the link just before the meunbar
	document.querySelector('a').focus();
},
	focusonfont: function(testPageDocument){
	// Move focus to the "Font" menu item
	document.querySelector('[role=menuitem]').focus();
},
	focusonfont: function(testPageDocument){
	// Move focus to the "Font" menu item
	document.querySelector('[role=menuitem]').focus();
},
	openfontsubmenu: function(testPageDocument){
	// Open "Font" menu item and move focus to the "Font" menu item
	document.querySelector('[role=menuitem]').setAttribute('aria-expanded', 'true');
	document.querySelector('[role=menuitem]').focus();
},
	focusonfont: function(testPageDocument){
	// Move focus to the "Font" menu item
	document.querySelector('[role=menuitem]').focus();
},
	opentextalignsubmenu: function(testPageDocument){
	// open "Text Align" menuitem and give the "Text ALign" menu item focus
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelectorAll('[role=menuitem]')[1].focus();
},
	focusonstylecolor: function(testPageDocument){
	// Move focus to the "Style/Color" menu item
	document.querySelectorAll('[role=menuitem]')[1].focus();
},
	focusonstylecolorblue: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Blue' menu item radio option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="font-color"]').firstElementChild.nextElementSibling.focus();
},
	focusonstylecolorblue: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Blue' menu item radio option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="font-color"]').firstElementChild.nextElementSibling.focus();
},
	focusonstylecoloritalic: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Italic' menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="italic"]').focus();
},
	focusonstylecoloritalic: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Italic' menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="italic"]').focus();
},
	focusonstylecoloritalic: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Italic' menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="italic"]').focus();
},
	focusonstylecoloritalic: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Italic' menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="italic"]').focus();
},
	focusontextalign: function(testPageDocument){
	// Move focus to the "Text Align" menu item
	document.querySelector('[role=menuitem]')[2].focus();
},
	focusontextalign: function(testPageDocument){
	// Move focus to the "Text Align" menu item
	document.querySelector('[role=menuitem]')[2].focus();
},
	focusontextalignleft: function(testPageDocument){
	// open "Text Align" menu item and move focus to the 'Left' menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[2].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="text-align"]').firstElementChild.focus();
},
	focusontextalignleft: function(testPageDocument){
	// open "Text Align" menu item and move focus to the 'Left' menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[2].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="text-align"]').firstElementChild.focus();
},
	focusonsize: function(testPageDocument){
	// Move focus to the "Size" menu item
	document.querySelector('[role=menuitem]')[3].focus();
},
	focusonsize: function(testPageDocument){
	// Move focus to the "Size" menu item
	document.querySelector('[role=menuitem]')[3].focus();
},
	focusonstylecolorblack: function(testPageDocument){
	// open "Style/Color" menu item and move focue to the 'Black' menu item radio option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="font-color"]').firstElementChild.focus();
},
	focusonstylecolorblack: function(testPageDocument){
	// open "Style/Color" menu item and move focue to the 'Black' menu item radio option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="font-color"]').firstElementChild.focus();
},
	focusonstylecolorbold: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Bold' menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="bold"]').focus();
},
	focusonstylecolorbold: function(testPageDocument){
	// open "Style/Color" menu item and move focus to the 'Bold' menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[1].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="bold"]').focus();
},
	focusonsizelargerdisabled: function(testPageDocument){
	// open "Size" menu item, disable the "Larger" option and move focus to the "Larger" menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[3].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="font-larger"]').setAttribute('aria-disabled', 'true');
	document.querySelector('[data-option="font-larger"]').focus();
},
	focusonsizelargerdisabled: function(testPageDocument){
	// open "Size" menu item, disable the "Larger" option and move focus to the "Larger" menu item checkbox option
	document.querySelectorAll('[role=menuitem]')[3].setAttribute('aria-expanded', 'true');
	document.querySelector('[data-option="font-larger"]').setAttribute('aria-disabled', 'true');
	document.querySelector('[data-option="font-larger"]').focus();
}
};