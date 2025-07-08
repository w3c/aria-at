// deactivates the first tab in the tab list, and sets focus on the first link
// Select the first tab and its corresponding panel
const firstTab = document.querySelector('#tab-1');
const firstPanel = document.querySelector('#tabpanel-1');

// Deactivate the tab and hide the panel if they exist
if (firstTab && firstPanel) {
    firstTab.setAttribute('aria-selected', 'false');
    firstTab.setAttribute('tabindex', '-1');
    firstPanel.classList.add('is-hidden');
}

// Find the link before the example and set focus on it
const linkBefore = document.querySelector('#beforelink');
if (linkBefore) {
    linkBefore.focus();
}
