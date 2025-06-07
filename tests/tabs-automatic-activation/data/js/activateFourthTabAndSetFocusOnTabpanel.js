// activates the fourth tab in the tab list, and sets focus on the tab panel
/**
 * Activates the fourth tab in the tab list and sets focus on the tab panel.
 * This version manually manipulates the DOM attributes to avoid timing issues.
 */
function setupScript() {
  // Find all tabs and panels
  const allTabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const allPanels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  // The fourth tab is at index 3
  const targetIndex = 3;
  const targetTab = allTabs[targetIndex];

  if (!targetTab) {
    console.error('Could not find the target tab.');
    return;
  }

  const targetPanelId = targetTab.getAttribute('aria-controls');
  const targetPanel = document.getElementById(targetPanelId);

  if (!targetPanel) {
    console.error('Could not find the target panel.');
    return;
  }

  // 1. Deactivate all tabs and hide all panels
  allTabs.forEach(tab => {
    tab.setAttribute('aria-selected', 'false');
    tab.setAttribute('tabindex', '-1');
  });

  allPanels.forEach(panel => {
    // Assuming 'is-hidden' is the class used to hide panels, as in the example
    panel.classList.add('is-hidden');
  });

  // 2. Activate the fourth tab
  targetTab.setAttribute('aria-selected', 'true');
  targetTab.removeAttribute('tabindex');

  // 3. Show the fourth panel and set focus on it
  targetPanel.classList.remove('is-hidden');
  targetPanel.focus();
}

// Ensure this runs after the page is fully loaded
window.addEventListener('load', setupScript);
