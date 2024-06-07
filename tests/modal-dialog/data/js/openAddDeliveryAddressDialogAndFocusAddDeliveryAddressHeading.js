// opens the 'Add Delivery Address' modal dialog, and sets focus on the 'Add Delivery Address' heading
const btn = testPageDocument.querySelector('#ex1 > button');

// Ensure the button is found
if (btn) {
  btn.click(); // Simulate a click on the button to open the dialog
} else {
  console.error('Button not found');
}

// Ensure the dialog opening function is defined
if (typeof testPageDocument.defaultView.openDialog === 'function') {
  testPageDocument.defaultView.openDialog('dialog1', undefined, 'dialog1_label');
} else {
  console.error('openDialog function is not defined');
}
