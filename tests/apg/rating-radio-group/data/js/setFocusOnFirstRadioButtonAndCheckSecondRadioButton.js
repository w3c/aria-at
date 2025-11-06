// sets focus on the first radio button, and checks the  second radio button

let firstRadio = document.querySelector('[data-rating="1"]');
let secondRadio = document.querySelector('[data-rating="2"]');
document.defaultView.radioController.setChecked(secondRadio);
firstRadio.focus();
