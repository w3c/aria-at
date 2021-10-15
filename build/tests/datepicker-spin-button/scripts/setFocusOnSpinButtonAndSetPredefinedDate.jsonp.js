window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  setFocusOnSpinButtonAndSetPredefinedDate(testPageDocument) {
    // sets the date picker to March 19, 2021, and sets focus on the 'Day' spin button
    testPageDocument.defaultView.datepicker.spinbuttonYear.setValue(2021);
    testPageDocument.defaultView.datepicker.spinbuttonMonth.setValue(2);
    testPageDocument.defaultView.datepicker.spinbuttonYear.setValue(19);
    testPageDocument.querySelectorAll('button').forEach(btn => btn.style.display = 'none');
    testPageDocument.defaultView.datepicker.spinbuttonDay.spinbuttonNode.focus();
  }
});
