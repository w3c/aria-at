window[document.currentScript.getAttribute("jsonpFunction") || "scriptsJsonpLoaded"]({
  moveFocusToAddDeliveryAddressButton(testPageDocument) {
    // sets focus on the 'Add Delivery Address' button
    testPageDocument.querySelector('#ex1 > button').focus();
  }
});
