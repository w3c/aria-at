(function(window, document){

  // Getting references to DOM elements

  const $role_correct_radio = document.querySelector('[type="radio"][name="checkbox_role_spoken"][value="correct"]');
  const $role_incomplete_radio = document.querySelector('[type="radio"][name="checkbox_role_spoken"][value="incomplete"]');
  const $role_incorrect_radio = document.querySelector('[type="radio"][name="checkbox_role_spoken"][value="incorrect"]');

  const $name_correct_radio = document.querySelector('[type="radio"][name="name_lettuce_spoken"][value="correct"]');
  const $name_incomplete_radio = document.querySelector('[type="radio"][name="name_lettuce_spoken"][value="incomplete"]');
  const $name_incorrect_radio = document.querySelector('[type="radio"][name="name_lettuce_spoken"][value="incorrect"]');

  const $state_correct_radio = document.querySelector('[type="radio"][name="checkbox_state_conveyed"][value="correct"]');
  const $state_incomplete_radio = document.querySelector('[type="radio"][name="checkbox_state_conveyed"][value="incomplete"]');
  const $state_incorrect_radio = document.querySelector('[type="radio"][name="checkbox_state_conveyed"][value="incorrect"]');

  const $tickAllCorrectButton = document.querySelector('.js-allCorrect');
  const $tickAllIncompleteButton = document.querySelector('.js-allIncomplete');
  const $tickAllIncorrectButton = document.querySelector('.js-allIncorrect');

  // Add event listeners

  $tickAllCorrectButton.addEventListener('click', function tickAllCorrect() {
    $role_correct_radio.checked = true;
    $name_correct_radio.checked = true;
    $state_correct_radio.checked = true;
  });

  $tickAllIncompleteButton.addEventListener('click', function tickAllIncomplete() {
    $role_incomplete_radio.checked = true;
    $name_incomplete_radio.checked = true;
    $state_incomplete_radio.checked = true;
  });

  $tickAllIncorrectButton.addEventListener('click', function tickAllIncorrect() {
    $role_incorrect_radio.checked = true;
    $name_incorrect_radio.checked = true;
    $state_incorrect_radio.checked = true;
  });

})(window, document)