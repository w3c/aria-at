// activates the fourth tab in the tab list, and sets focus on the tab panel
/**
 * Activates the fourth tab in the tab list and sets focus on the tab panel.
 */
function setupScript() {
  const fourthTab = document.getElementById('tab-4');
  const fourthPanel = document.getElementById('tabpanel-4');

  if (fourthTab && fourthPanel) {
    // Programmatically click the tab to activate it.
    // This relies on the event listeners set up in the example's main JS file.
    fourthTab.click();

    // Set focus to the now-visible panel.
    fourthPanel.focus();
  }
}

// Example of how you might call it after the page loads
window.addEventListener('load', setupScript);
