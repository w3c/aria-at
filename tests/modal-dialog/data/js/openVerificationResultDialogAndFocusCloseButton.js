// opens the 'Add Delivery Address' dialog followed by the 'Verification Result' dialog, and sets focus on the 'Close' button inside the second dialog
const AddDeliveryBtn = testPageDocument.querySelector('#ex1 > button');
AddDeliveryBtn.focus();
AddDeliveryBtn.click();
const verifyBtn = testPageDocument.querySelector('#dialog1 button:nth-child(1)')
verifyBtn.focus();
verifyBtn.click();
testPageDocument.querySelector('#dialog2 button:nth-child(2)').focus();
