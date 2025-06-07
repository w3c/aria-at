// activates the fourth tab in the tab list, and sets focus on the tab panel
// Step 1: Find the fourth tab and focus it. This works and triggers the activation.
const fourthTab = document.querySelector('button[aria-controls="tabpanel-4"]');
if (fourthTab) {
  fourthTab.focus();
}

// Step 2: Use setTimeout to wait for the browser to make the panel visible.
setTimeout(() => {
  const fourthPanel = document.getElementById('tabpanel-4');
  if (fourthPanel) {
    // Now that the panel is visible, this should work.
    fourthPanel.focus();
  }
}, 0); // A 0ms delay is sufficient to let the browser process the DOM update.
