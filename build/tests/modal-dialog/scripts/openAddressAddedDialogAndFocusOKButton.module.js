export function openAddressAddedDialogAndFocusOKButton(testPageDocument) {
  // opens the 'Add Delivery Address' dialog followed by the 'Address Added' dialog, and sets focus on the 'your profile' link inside the second dialog
  const btn = testPageDocument.querySelector('#ex1 > button');
  testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_add');
  testPageDocument.defaultView.replaceDialog('dialog3', btn, 'dialog3_close_btn');
}
