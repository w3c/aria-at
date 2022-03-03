export function focusonfirstlink(testPageDocument) {
  // Move focus to the link just before the meunbar
  testPageDocument.querySelector('a').focus();
}

export function focusonfont(testPageDocument) {
  // Move focus to the "Font" menu item
  testPageDocument.querySelectorAll('[role=menuitem]')[0].focus();
}

export function focusonsize(testPageDocument) {
  // Move focus to the "Size" menu item
  testPageDocument.querySelectorAll('[role=menuitem]')[3].focus();
}

export function focusonstylecolor(testPageDocument) {
  // Move focus to the "Style/Color" menu item
  testPageDocument.querySelectorAll('[role=menuitem]')[1].focus();
}

export function focusontextalign(testPageDocument) {
  // Move focus to the "Text Align" menu item
  testPageDocument.querySelectorAll('[role=menuitem]')[2].focus();
}
