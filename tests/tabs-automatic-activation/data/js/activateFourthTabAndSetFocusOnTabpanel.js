// activates the fourth tab in the tab list, and sets focus on the tab panel
const fourthTab = document.querySelector('button[aria-controls="tabpanel-4"]');
if (fourthTab) {
  fourthTab.focus();
}
const fourthPanel = document.getElementById('tabpanel-4');
if (fourthPanel) {
  fourthPanel.focus();
}
