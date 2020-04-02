// Set focus on button
// Ensure in expanded state.
var cb = testPageDocument.comboboxAutocomplete;
cb.buttonNode.focus();
cb.filter = cb.comboboxNode.value;
cb.filterOptions();
cb.open();
