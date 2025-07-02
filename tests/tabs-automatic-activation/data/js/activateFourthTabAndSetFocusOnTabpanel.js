// activates the fourth tab in the tab list, and sets focus on the tab panel// 1. Deactivate all tabs by resetting their attributes
document.querySelectorAll('[role="tab"]').forEach(t => {
  t.setAttribute('tabindex', '-1');
  t.setAttribute('aria-selected', 'false');
});

// 2. Hide all tab panels
document.querySelectorAll('[role="tabpanel"]').forEach(p => {
  p.classList.add('is-hidden');
});

// 3. Select the specific fourth tab and panel using their unique IDs
let fourthTab = document.querySelector('#tab-4');
let fourthPanel = document.querySelector('#tabpanel-4');

// 4. Activate the fourth tab and show its panel
if (fourthTab && fourthPanel) {
  fourthTab.removeAttribute('tabindex');
  fourthTab.setAttribute('aria-selected', 'true');
  fourthPanel.classList.remove('is-hidden');

  // 5. Set focus on the panel
  fourthPanel.focus();
}
