// sets focus on a link after the switch, and sets the switch state to 'on'
testPageDocument.querySelector('[role="switch"]').setAttribute('checked', 'true');
testPageDocument.getElementById('afterlink').focus();
