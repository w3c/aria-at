// Set focus on combobox
// Set value of 'combobox' to 'Alabama'
// Ensure in expanded state.
var cb = testPageDocument.comboboxAutocomplete;
cb.comboboxNode.value = '';
cb.combobox.focus();
cb.filter = cb.comboboxNode.value;
cb.filterOptions();
cb.open();
