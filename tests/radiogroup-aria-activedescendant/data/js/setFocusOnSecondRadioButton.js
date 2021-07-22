// sets focus on the second radio button
let radioGroup = testPageDocument.querySelector('[role="radiogroup"]');
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
	r.setAttribute('aria-checked', 'false');
	r.classList.remove('focus');
});
radios[1].classList.add('focus');
radioGroup.setAttribute('aria-activedescendant', radios[1].id);
radioGroup.focus();
