// sets the state of the fifth radio button to checked, and sets focus on a link after the radio group

let radio = document.querySelector('[data-rating="5"]');
document.defaultView.radioController.setChecked(radio);
document.querySelector('#afterlink').focus();
