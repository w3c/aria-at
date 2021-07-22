// sets focus on the first radio button
let radios = testPageDocument.querySelectorAll('[role="radio"]');
radios.forEach(r => {
	r.setAttribute('aria-checked', 'false');
	r.tabIndex = -1;
});
radios[0].tabIndex = 0;
radios[0].focus();
