// collapses the 'Personal Information' accordion header, and sets focus on a link before it
(() => {
  const header1Button = document.querySelector('#accordion1id');
  const panel1 = document.querySelector('#sect1');
  const linkBefore = document.querySelector('#beforelink');

  if (header1Button && panel1 && linkBefore) {
    header1Button.setAttribute('aria-expanded', 'false');
    panel1.setAttribute('hidden', ''); // or panel1.hidden = true;

    linkBefore.focus();
  } else {
    console.error(
      'SetupScript 5 Error: Elements not found (#accordion1id, #sect1, or #beforelink)'
    );
  }
})();
