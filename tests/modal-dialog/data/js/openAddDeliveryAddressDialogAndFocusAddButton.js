// opens the 'Add Delivery Address' modal dialog, and sets focus on the 'Add' button
const btn = testPageDocument.querySelector('#ex1 > button');
btn.focus();
btn.click();
testPageDocument.querySelector('#dialog1 button:nth-child(2)').focus();
