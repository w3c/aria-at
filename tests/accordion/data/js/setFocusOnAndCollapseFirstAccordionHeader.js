// collapses and sets focus on the 'Personal Information' accordion header
(() => {
  const header1Button = document.querySelector('#accordion1id');
  const panel1 = document.querySelector('#sect1');

  if (header1Button && panel1) {
    // Collapse the first accordion section
    header1Button.setAttribute('aria-expanded', 'false');
    panel1.setAttribute('hidden', ''); // or panel1.hidden = true;

    header1Button.focus();
  } else {
    console.error('SetupScript 2 Error: Accordion 1 elements not found (#accordion1id or #sect1)');
  }
})();
