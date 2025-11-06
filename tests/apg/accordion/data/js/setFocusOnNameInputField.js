// sets focus on the 'Name' input field in the 'Personal Information' region

(() => {
  const nameInput = document.querySelector('#cufc1');

  if (nameInput) {
    // Ensure the 'Personal Information' section is expanded (it is by default)

    nameInput.focus();
  } else {
    console.error("SetupScript Error: 'Name' input field with ID #cufc1 not found.");
  }
})();
