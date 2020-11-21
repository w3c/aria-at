// sets focus on and expands the Combobox
testPageDocument.querySelector('[role="combobox"]').focus();
window.setTimeout(onSelectReady, 500);

function onSelectReady() {
	console.log('opening listbox');
	window.selectController.updateMenuState(true);
}
