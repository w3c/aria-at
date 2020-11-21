// sets focus on and expands the Combobox
testPageDocument.querySelector('[role="combobox"]').focus();
window.setTimeout(onSelectReady, 500);

function onSelectReady() {
	window.selectController.updateMenuState(true);
}
