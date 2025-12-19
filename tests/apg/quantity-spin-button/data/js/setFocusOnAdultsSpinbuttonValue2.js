// sets focus on the 'Adults' spinbutton and sets value to 2
testPageDocument.defaultView.spinButtonController.setValue('2', true);
testPageDocument.getElementById('adults').select();
testPageDocument.getElementById('adults').focus();
