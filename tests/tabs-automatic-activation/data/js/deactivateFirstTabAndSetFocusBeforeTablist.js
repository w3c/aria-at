// deactivates the first tab in the tab list, and sets focus on the first link
// Select all the necessary elements from the DOM
const firstTab = document.querySelector('#tab-1');
const firstPanel = document.querySelector('#tabpanel-1');
const secondTab = document.querySelector('#tab-2');
const secondPanel = document.querySelector('#tabpanel-2');
const firstLink = document.querySelector('#beforelink');
// Deactivate the first tab and hide its associated panel
if (firstTab && firstPanel) {
  firstTab.setAttribute('aria-selected', 'false');
  firstTab.setAttribute('tabindex', '-1');
  firstPanel.classList.add('is-hidden');
}
// Activate the second tab and make its panel visible
if (secondTab && secondPanel) {
  secondTab.setAttribute('aria-selected', 'true');
  secondTab.setAttribute('tabindex', '0');
  secondPanel.classList.remove('is-hidden');
}
// Set focus on the first link before the tablist
if (firstLink) {
  firstLink.focus();
}
