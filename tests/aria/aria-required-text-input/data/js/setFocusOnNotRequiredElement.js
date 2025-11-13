// Set  aria-required attribute on the text input to "false"
var input = testPageDocument.getElementById('imaginary-word');
if (input) {
  input.setAttribute('aria-required', 'false');
}
// set focus on the not required text input
testPageDocument.querySelector('#imaginary-word').focus();
