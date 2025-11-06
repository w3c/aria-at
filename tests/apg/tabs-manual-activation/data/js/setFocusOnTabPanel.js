// sets focus on the link inside the tab panel
// Find the first link inside the first tab panel.
const linkInPanel = document.querySelector('#tabpanel-1 a');
// Set focus on the link if it is found.
if (linkInPanel) {
  linkInPanel.focus();
}
