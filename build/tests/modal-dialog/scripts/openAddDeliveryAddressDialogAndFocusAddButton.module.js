export function openAddDeliveryAddressDialogAndFocusAddButton(testPageDocument) {
  // opens the 'Add Delivery Address' modal dialog, and sets focus on the 'Add' button
  const btn = testPageDocument.querySelector('#ex1 > button');
  testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_add');
}
