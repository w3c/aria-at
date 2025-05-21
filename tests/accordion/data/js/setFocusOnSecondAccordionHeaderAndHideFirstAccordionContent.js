// sets focus on the 'Billing Address' accordion header, and hides the content associated with the 'Personal Information' accordion header
(() => {
  const header1Button = document.querySelector('#accordion1id');
  const panel1 = document.querySelector('#sect1');
  const header2Button = document.querySelector('#accordion2id');

  if (header1Button && panel1 && header2Button) {
    header1Button.setAttribute('aria-expanded', 'true');
    panel1.removeAttribute('hidden'); // Ensure panel is visible

    header2Button.focus();
  } else {
    console.error(
      'SetupScript 3 Error: Accordion elements not found (#accordion1id, #sect1, or #accordion2id)'
    );
  }
})();
