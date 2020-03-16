/*
*   This content is licensed according to the W3C Software License at
*   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*
*   File:   menubar-editor.js
*
*   Desc:   Creates a menubar to control the styling of text in a textarea element
*/

var MenubarEditor = function (domNode) {

  this.domNode = domNode;

  this.menubarMenuitems = []; // see Menubar init method
  this.menubarFirstChars = []; // see Menubar init method

  this.firstMenubarMenuitem = null; // see Menubar init method
  this.lastMenubarMenuitem = null; // see Menubar init method
};

MenubarEditor.prototype.init = function (actionManager) {
  var i, menuitems, menuitem;

  this.actionManager = actionManager;

  this.domNode.addEventListener('focusin', this.handleMenubarFocusin.bind(this));
  this.domNode.addEventListener('focusout', this.handleMenubarFocusout.bind(this));

  menuitems = this.domNode.querySelectorAll('li > [role="menuitem"]');

  for(i = 0; i < menuitems.length; i++) {
    menuitem = menuitems[i];

    menuitem.tabIndex = -1;
    this.menubarMenuitems.push(menuitem);
    this.menubarFirstChars.push(menuitem.textContent[0].toLowerCase());

    menuitem.addEventListener('keydown', this.handleMenubarKeydown.bind(this));

    if( !this.firstMenubarMenuitem) {
      menuitem.tabIndex = 0;
      this.firstMenubarMenuitem = menuitem;
    }
    this.lastMenubarMenuitem = menuitem;
  }



};

/* MenubarEditor FOCUS MANAGEMENT METHODS */

MenubarEditor.prototype.setMenubarFocusToMenuitem = function (menuitem) {

  this.menubarMenuitems.forEach(function(item) {
    item.tabIndex = -1;
  });

  menuitem.tabIndex = 0;
  menuitem.focus();


};

MenubarEditor.prototype.setMenubarFocusToFirstMenuitem = function () {
  this.setMenubarFocusToMenuitem(this.firstMenubarMenuitem);
};

MenubarEditor.prototype.setMenubarFocusToLastMenuitem = function () {
  this.setMenubarFocusToMenuitem(this.lastMenubarMenuitem);
};

MenubarEditor.prototype.setMenubarFocusToPreviousMenuitem = function (currentMenuitem) {
  var newMenuitem, index;

  if (currentMenuitem === this.firstMenubarMenuitem) {
    newMenuitem = this.lastMenubarMenuitem;
  }
  else {
    index = this.menubarMenuitems.indexOf(currentMenuitem);
    newMenuitem = this.menubarMenuitems[ index - 1 ];
  }

  this.setMenubarFocusToMenuitem(newMenuitem);
};

MenubarEditor.prototype.setMenubarFocusToNextMenuitem = function (currentMenuitem) {
  var newMenuitem, index;

  if (currentMenuitem === this.lastMenubarMenuitem) {
    newMenuitem = this.firstMenubarMenuitem;
  }
  else {
    index = this.menubarMenuitems.indexOf(currentMenuitem);
    newMenuitem = this.menubarMenuitems[ index + 1 ];
  }
  this.setMenubarFocusToMenuitem(newMenuitem);
};

MenubarEditor.prototype.setMenubarFocusByFirstCharacter = function (currentMenuitem, char) {
  var start, index;

  char = char.toLowerCase();

  // Get start index for search based on position of currentItem
  start = this.menubarMenuitems.indexOf(currentMenuitem) + 1;
  if (start >=  this.menubarMenuitems.length) {
    start = 0;
  }

  // Check remaining slots in the menu
  index = this.getMenubarIndexFirstChars(start, char);

  // If not found in remaining slots, check from beginning
  if (index === -1) {
    index = this.getMenubarIndexFirstChars(0, char);
  }

  // If match was found...
  if (index > -1) {
    this.menubarMenuitems[index].focus();
    this.menubarMenuitems[index].tabIndex = 0;
    currentMenuitem.tabIndex = -1;
  }
};

MenubarEditor.prototype.getMenubarIndexFirstChars = function (startIndex, char) {
  for (var i = startIndex; i < this.menubarFirstChars.length; i++) {
    if (char === this.menubarFirstChars[i]) {
      return i;
    }
  }
  return -1;
};

// Event handlers

MenubarEditor.prototype.handleMenubarFocusin = function (event) {
  // if the menubar or any of its menus has focus, add styling hook for hover
  this.domNode.classList.add('focus');
};

MenubarEditor.prototype.handleMenubarFocusout = function (event) {
  // remove styling hook for hover on menubar item
  this.domNode.classList.remove('focus');
};

MenubarEditor.prototype.handleMenubarKeydown = function (event) {
  var tgt = event.currentTarget,
    key = event.key,
    flag = false;

  function isPrintableCharacter (str) {
    return str.length === 1 && str.match(/\S/);
  }

  console.log('[handleMenubarKeydown]: ' + key);

  switch (key) {
    case ' ':
    case 'Enter':
    case 'ArrowDown':
    case 'Down':
      break;

    case 'Esc':
    case 'Escape':
      break;

    case 'Left':
    case 'ArrowLeft':
      this.setMenubarFocusToPreviousMenuitem(tgt);
      flag = true;
      break;

    case 'Right':
    case 'ArrowRight':
      this.setMenubarFocusToNextMenuitem(tgt);
      flag = true;
      break;

    case 'Up':
    case 'ArrowUp':
      break;

    case 'Home':
    case 'PageUp':
      this.setMenubarFocusToFirstMenuitem();
      flag = true;
      break;

    case 'End':
    case 'PageDown':
      this.setMenubarFocusToLastMenuitem();
      flag = true;
      break;

    default:
      if (isPrintableCharacter(key)) {
        this.setMenubarFocusByFirstCharacter(tgt, key);
        flag = true;
      }
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
};


// Initialize menubar editor

window.addEventListener('load', function () {
  var styleManager  = new StyleManager('textarea1');
  var menubarEditor = new MenubarEditor(document.getElementById('menubar1'));
  menubarEditor.init(styleManager);
});

