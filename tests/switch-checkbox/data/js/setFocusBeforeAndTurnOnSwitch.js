// sets focus on a link before the switch, and sets the state of the switch to 'on'
testPageDocument.querySelector('[role="switch"]').setAttribute('checked', 'true');
testPageDocument.getElementById('beforelink').focus();
