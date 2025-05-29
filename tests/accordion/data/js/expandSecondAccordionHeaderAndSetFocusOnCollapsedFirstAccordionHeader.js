// expands the 'Billing Address' accordion header, and sets focus on the 'Personal Information' accordion header
(() => {
  const personalInfoHeaderButton = document.querySelector('#accordion1id');
  const personalInfoPanel = document.querySelector('#sect1');
  const billingAddressHeaderButton = document.querySelector('#accordion2id');
  const billingAddressPanel = document.querySelector('#sect2');

  if (
    personalInfoHeaderButton &&
    personalInfoPanel &&
    billingAddressHeaderButton &&
    billingAddressPanel
  ) {
    personalInfoHeaderButton.setAttribute('aria-expanded', 'false');
    personalInfoPanel.setAttribute('hidden', '');

    billingAddressHeaderButton.setAttribute('aria-expanded', 'true');
    billingAddressPanel.removeAttribute('hidden');

    // Set focus on the 'Personal Information' accordion header button
    personalInfoHeaderButton.focus();
  } else {
    console.error(
      'SetupScript Error: Accordion elements not found (#accordion1id, #sect1, #accordion2id, or #sect2)'
    );
  }
})();
