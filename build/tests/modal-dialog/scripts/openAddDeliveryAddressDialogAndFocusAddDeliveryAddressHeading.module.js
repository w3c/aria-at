export function openAddDeliveryAddressDialogAndFocusAddDeliveryAddressHeading(testPageDocument) {
  // opens the 'Add Delivery Address' modal dialog, and sets focus on the 'Add Delivery Address' heading

  const btn = testPageDocument.querySelector('#ex1 > button');
  testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_label');
}
