window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusBeforeRadioGroup(testPageDocument) {
    // sets focus on a link before the radio group, and hides the group heading
    testPageDocument.querySelector('#beforelink').focus();
    testPageDocument.querySelector('#group_label_1').style.display = 'none';
  }
});
