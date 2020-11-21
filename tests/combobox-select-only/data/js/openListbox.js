// sets focus on and expands the Combobox
testPageDocument.querySelector('[role="combobox"]').focus();
window.addEventListener('selectReady', onSelectReady, false);

function onSelectReady() {
	window.selectController.updateMenuState(true);
}
