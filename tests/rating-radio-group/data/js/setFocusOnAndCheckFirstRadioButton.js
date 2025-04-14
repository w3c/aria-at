// sets focus on the first radio button, and sets its state to checked

let radio = document.querySelector('[data-rating="1"]');
document.defaultView.radioController.setChecked(radio);
