// activates the fourth tab in the tab list, and sets focus on the link inside the tab panel
// Select the elements for the default active tab (Tab 1)
const firstTab = document.querySelector('#tab-1');
const firstPanel = document.querySelector('#tabpanel-1');
// Select the elements for the target tab (Tab 4) and the link inside it
const fourthTab = document.querySelector('#tab-4');
const fourthPanel = document.querySelector('#tabpanel-4');
const linkInPanel = document.querySelector('#tabpanel-4 a');
// Deactivate the first tab and hide its panel
if (firstTab && firstPanel) {
  firstTab.setAttribute('aria-selected', 'false');
  firstTab.setAttribute('tabindex', '-1');
  firstPanel.classList.add('is-hidden');
}
// Activate the fourth tab and make its panel visible
if (fourthTab && fourthPanel) {
  fourthTab.setAttribute('aria-selected', 'true');
  fourthTab.setAttribute('tabindex', '0');
  fourthPanel.classList.remove('is-hidden');
}
// Set focus on the link inside the fourth panel
if (linkInPanel) {
  linkInPanel.focus();
}
