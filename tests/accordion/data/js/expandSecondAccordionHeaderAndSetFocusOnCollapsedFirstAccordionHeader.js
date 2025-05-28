// expands the 'Billing Address' accordion header, and sets focus on the 'Personal Information' accordion header
(() => {
  const personalInfoHeaderButton = document.querySelector('#accordion1id');
  const billingAddressHeaderButton = document.querySelector('#accordion2id');
  const billingAddressPanel = document.querySelector('#sect2');

  if (personalInfoHeaderButton && billingAddressHeaderButton && billingAddressPanel) {
    // Expand the 'Billing Address' accordion section
    billingAddressHeaderButton.setAttribute('aria-expanded', 'true');
    billingAddressPanel.removeAttribute('hidden');

    // Set focus on the 'Personal Information' accordion header button
    personalInfoHeaderButton.focus();
  } else {
    console.error(
      'SetupScript Error: Accordion elements not found (#accordion1id, #accordion2id, or #sect2)'
    );
  }
})();
