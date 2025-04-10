// sets the state of the first radio button to checked, and sets focus on a link before the radio group

let radio = document.querySelector('[data-rating="1"]');
document.defaultView.radioController.setChecked(radio);
document.querySelector('#beforelink').focus();
