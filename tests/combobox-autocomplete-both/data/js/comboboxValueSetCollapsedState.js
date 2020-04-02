// Set focus on combobox
// Set value of 'combobox' to 'Alabama'
// Ensure in collapsed state.
var cb = testPageDocument.comboboxAutocomplete;
cb.comboboxNode.value = 'Alabama';
cb.comboboxNode.focus();
cb.filter = cb.comboboxNode.value;
cb.filterOptions();

