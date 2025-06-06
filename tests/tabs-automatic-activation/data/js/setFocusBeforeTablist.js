// sets focus on a link before the tab list
function setupScript() {
  const linkBefore = document.getElementById('beforelink');
  if (linkBefore) {
    linkBefore.focus();
  }
}
