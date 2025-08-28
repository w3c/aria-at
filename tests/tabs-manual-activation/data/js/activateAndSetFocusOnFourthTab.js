// Activates and sets focus on the fourth tab
document.querySelectorAll('[role="tab"]').forEach(tab => {
  tab.setAttribute('aria-selected', 'false');
  tab.setAttribute('tabindex', '-1');
});
document.querySelectorAll('[role="tabpanel"]').forEach(panel => {
  panel.classList.add('is-hidden');
});
// Find the fourth tab and its corresponding panel
const fourthTab = document.querySelector('#tab-4');
const fourthPanel = document.querySelector('#tabpanel-4');
// Activate the tab, show the panel, and set focus
if (fourthTab && fourthPanel) {
  fourthTab.setAttribute('aria-selected', 'true');
  fourthTab.setAttribute('tabindex', '0');
  fourthPanel.classList.remove('is-hidden');
  fourthTab.focus();
}
