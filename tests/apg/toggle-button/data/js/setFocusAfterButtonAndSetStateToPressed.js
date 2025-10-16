// sets focus on a link after the button, and sets the state of the button to 'pressed'
let button = testPageDocument.querySelector('#toggle');
button.setAttribute('aria-pressed', 'true');
button.querySelector('use').setAttribute('xlink:href', '#icon-sound');
testPageDocument.querySelector('#afterlink').focus();
