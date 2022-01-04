window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  openAddDeliveryAddressDialogAndFocusCancelButton(testPageDocument) {
    // opens the 'Add Delivery Address' modal dialog, and sets focus on the 'Cancel' button
    const btn = testPageDocument.querySelector('#ex1 > button');
    testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_cancel');
  }
});
