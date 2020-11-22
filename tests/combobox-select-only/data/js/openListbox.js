// sets focus on and expands the Combobox
testPageDocument.querySelector('[role="combobox"]').focus();
window.setTimeout(onSelectReady, () => {
	console.log('Opening listbox');
	window.selectController.updateMenuState(true)
}, 500);
