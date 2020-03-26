// Set focus on combobox
// Set value of 'combobox' to 'a'
// Ensure in expanded state.
var cb = testPageDocument.comboboxAutocomplete;
cb.comboboxNode.value = 'a';
cb.comboboxNode.focus();
cb.filter = cb.comboboxNode.value;
cb.filterOptions();
cb.open();
