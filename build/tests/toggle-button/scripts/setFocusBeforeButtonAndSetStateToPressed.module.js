export function setFocusBeforeButtonAndSetStateToPressed(testPageDocument) {
  // sets focus on a link before the button, and sets the state of the button to 'pressed'
  let button = testPageDocument.querySelector('#toggle');
  button.setAttribute('aria-pressed', 'true');
  button.querySelector('use').setAttribute('xlink:href', '#icon-sound');
  testPageDocument.querySelector('#beforelink').focus();
}
