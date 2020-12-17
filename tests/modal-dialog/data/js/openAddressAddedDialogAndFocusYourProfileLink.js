// opens the 'Add Delivery Address' dialog followed by the 'Address Added' dialog, and sets focus on the 'your profile' link inside the second dialog
const AddDeliveryBtn = testPageDocument.querySelector('#ex1 > button');
AddDeliveryBtn.focus();
AddDeliveryBtn.click();
const addBtn = testPageDocument.querySelector('#dialog1 button:nth-child(2)')
addBtn.focus();
addBtn.click();
testPageDocument.querySelector('#dialog3_desc > a').focus();
