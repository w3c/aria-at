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
  },
  setFocusAfterTabpanel(testPageDocument) {
    // sets focus on a link after the tab panel
    testPageDocument.querySelector('#afterlink').focus();
  },
  setFocusBeforeTablist(testPageDocument) {
    // sets focus on a link before the tab list
    testPageDocument.querySelector('#beforelink').focus();
  },
  setFocusOnFirstTab(testPageDocument) {
    // sets focus on the first tab
    testPageDocument.querySelector('#nils').focus();
  },
  setFocusOnSecondTab(testPageDocument) {
    // sets focus on the second tab
    testPageDocument.querySelector('#agnes').focus();
  },
  setFocusOnThirdTab(testPageDocument) {
    // sets focus on the third tab
    testPageDocument.querySelector('#complex').focus();
  }
});
