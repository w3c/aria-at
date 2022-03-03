window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  activateThirdTabAndSetFocusOnTabpanel(testPageDocument) {
    // activates the third tab in the tab list, and sets focus on the tab panel
    testPageDocument.querySelectorAll('[role="tab"]').forEach(t => {
      t.setAttribute('tabindex', '-1');
      t.setAttribute('aria-selected', 'false');
    });

    testPageDocument.querySelectorAll('[role="tabpanel"]').forEach(p => {
      p.classList.add('is-hidden');
    });

    let thirdTab = testPageDocument.querySelector('#complex');
    let thirdPanel = testPageDocument.querySelector('#complex-complex');

    thirdTab.removeAttribute('tabindex');
    thirdTab.setAttribute('aria-selected', 'true');
    thirdPanel.classList.remove('is-hidden');
    thirdPanel.focus();
  }
});
