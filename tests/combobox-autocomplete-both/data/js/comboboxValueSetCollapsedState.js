// Set focus on combobox
// Set value of 'combobox' to 'Alabama'
// Ensure in collapsed state.
var node = testPageDocument.querySelector('[role=combobox]');
node.value = 'Alabama';
node.focus();
console.log('[node]: ' + node);
console.log('[comboboxTest]: ' + testPageDocument.comboboxTest);
