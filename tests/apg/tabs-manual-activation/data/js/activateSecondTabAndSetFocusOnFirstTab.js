// activates the second tab, and sets focus on the first tab
// Select the first and second tabs and their panels
const firstTab = document.querySelector('#tab-1');
const firstPanel = document.querySelector('#tabpanel-1');
const secondTab = document.querySelector('#tab-2');
const secondPanel = document.querySelector('#tabpanel-2');
// Deactivate the first tab and hide its panel
if (firstTab && firstPanel) {
  firstTab.setAttribute('aria-selected', 'false');
  firstTab.setAttribute('tabindex', '-1');
  firstPanel.classList.add('is-hidden');
}
// Activate the second tab and show its panel
if (secondTab && secondPanel) {
  secondTab.setAttribute('aria-selected', 'true');
  secondTab.setAttribute('tabindex', '0');
  secondPanel.classList.remove('is-hidden');
}
// Set focus on the (now inactive) first tab
if (firstTab) {
  firstTab.focus();
}
