// sets focus on the second radio button, and checks the first radio button

let firstRadio = document.querySelector('[data-rating="1"]');
let secondRadio = document.querySelector('[data-rating="2"]');
document.defaultView.radioController.setChecked(firstRadio);
secondRadio.focus();
