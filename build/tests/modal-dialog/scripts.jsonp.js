window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToAddDeliveryAddressButton(testPageDocument) {
    // sets focus on the 'Add Delivery Address' button
    testPageDocument.querySelector('#ex1 > button').focus();
  },
  openAddDeliveryAddressDialogAndFocusAddButton(testPageDocument) {
    // opens the 'Add Delivery Address' modal dialog, and sets focus on the 'Add' button
    const btn = testPageDocument.querySelector('#ex1 > button');
    testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_add');
  },
  openAddDeliveryAddressDialogAndFocusAddDeliveryAddressHeading(testPageDocument) {
    // opens the 'Add Delivery Address' modal dialog, and sets focus on the 'Add Delivery Address' heading

    const btn = testPageDocument.querySelector('#ex1 > button');
    testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_label');
  },
  openAddDeliveryAddressDialogAndFocusCancelButton(testPageDocument) {
    // opens the 'Add Delivery Address' modal dialog, and sets focus on the 'Cancel' button
    const btn = testPageDocument.querySelector('#ex1 > button');
    testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_cancel');
  },
  openAddDeliveryAddressDialogAndFocusFirstInput(testPageDocument) {
    // opens the 'Add Delivery Address' modal dialog, and sets focus on the first input
    const btn = testPageDocument.querySelector('#ex1 > button');
    testPageDocument.defaultView.openDialog('dialog1', btn);
  },
  openAddressAddedDialogAndFocusAddressAddedHeading(testPageDocument) {
    // opens the 'Add Delivery Address' dialog followed by the 'Address Added' dialog, and sets focus on the 'Address added' heading inside the second dialog
    const btn = testPageDocument.querySelector('#ex1 > button');
    testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_add');
    testPageDocument.defaultView.replaceDialog('dialog3', undefined, 'dialog3_label');
  },
  openAddressAddedDialogAndFocusOKButton(testPageDocument) {
    // opens the 'Add Delivery Address' dialog followed by the 'Address Added' dialog, and sets focus on the 'your profile' link inside the second dialog
    const btn = testPageDocument.querySelector('#ex1 > button');
    testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_add');
    testPageDocument.defaultView.replaceDialog('dialog3', btn, 'dialog3_close_btn');
  },
  openVerificationResultDialogAndFocusCloseButton(testPageDocument) {
    // opens the 'Add Delivery Address' dialog followed by the 'Verification Result' dialog, and sets focus on the 'Close' button inside the second dialog
    const btn = testPageDocument.querySelector('#ex1 > button');
    testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_add');
    testPageDocument.defaultView.openDialog('dialog2', 'dialog1_verify', 'dialog2_close_btn');
  }
});
