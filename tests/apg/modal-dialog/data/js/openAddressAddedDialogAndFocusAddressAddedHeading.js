// opens the 'Add Delivery Address' dialog followed by the 'Address Added' dialog, and sets focus on the 'Address added' heading inside the second dialog
const btn = testPageDocument.querySelector('#ex1 > button');
testPageDocument.defaultView.openDialog('dialog1', btn, 'dialog1_add');
testPageDocument.defaultView.replaceDialog('dialog3', undefined, 'dialog3_label');
