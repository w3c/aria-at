// Set focus on combobox
// Set value of 'combobox' to 'a'
// Ensure in expanded state.
var node = testPageDocument.querySelector('[role=combobox]');
node.value = 'a';
node.focus();
console.log('[node]: ' + node);
console.log('[comboboxTest]: ' + testPageDocument.comboboxTest);
