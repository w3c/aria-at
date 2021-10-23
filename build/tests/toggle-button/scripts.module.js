export function setFocusAfterButton(testPageDocument) {
  // sets focus on a link after the button
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusAfterButtonAndSetStateToPressed(testPageDocument) {
  // sets focus on a link after the button, and sets the state of the button to 'pressed'
  let button = testPageDocument.querySelector('#toggle');
  button.setAttribute('aria-pressed', 'true');
  button.querySelector('use').setAttribute('xlink:href', '#icon-sound');
  testPageDocument.querySelector('#afterlink').focus();
}

export function setFocusBeforeButton(testPageDocument) {
  // sets focus on a link before the button
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusBeforeButtonAndSetStateToPressed(testPageDocument) {
  // sets focus on a link before the button, and sets the state of the button to 'pressed'
  let button = testPageDocument.querySelector('#toggle');
  button.setAttribute('aria-pressed', 'true');
  button.querySelector('use').setAttribute('xlink:href', '#icon-sound');
  testPageDocument.querySelector('#beforelink').focus();
}

export function setFocusOnButton(testPageDocument) {
  // sets focus on the button
  testPageDocument.querySelector('#toggle').focus();
}

export function setFocusOnButtonAndSetStateToPressed(testPageDocument) {
  // sets focus on the button, and sets its state to 'pressed'
  let button = testPageDocument.querySelector('#toggle');
  button.setAttribute('aria-pressed', 'true');
  button.querySelector('use').setAttribute('xlink:href', '#icon-sound');
  button.focus();
}
