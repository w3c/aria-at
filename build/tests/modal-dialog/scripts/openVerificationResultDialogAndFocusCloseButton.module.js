export function openVerificationResultDialogAndFocusCloseButton(testPageDocument) {
  // opens the 'Add Delivery Address' dialog followed by the 'Verification Result' dialog, and sets focus on the 'Close' button inside the second dialog
  const btn = testPageDocument.querySelector('#ex1 > button');
  testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_add');
  testPageDocument.defaultView.openDialog('dialog2', 'dialog1_verify', 'dialog2_close_btn');
}
