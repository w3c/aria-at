// sets focus on the first radio button, and sets its state to checked
let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
	r.setAttribute('aria-checked', 'false');
	r.classList.remove('focus');
});
radios[0].classList.add('focus');
radios[0].setAttribute('aria-checked', 'true');
radioGroup.setAttribute('aria-activedescendant', radios[0].id);
radioGroup.focus();
