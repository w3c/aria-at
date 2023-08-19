const fs = require('fs');

function generateFormattedString(keysArray, jsonData) {
  const formattedKeys = keysArray.map(key => {
    let normalizedKey = jsonData.keyAliases[key] || key;
    normalizedKey = jsonData.modifierAliases[normalizedKey] || normalizedKey;
    return jsonData.keys[normalizedKey] || '';
  });

  return formattedKeys.filter(Boolean).join('+'); // Filter out empty values and join with "+"
}

fs.readFile('commands.json', 'utf8', (err, data) => {
  if (err) {
    console.error('Error reading commands.json:', err);
    return;
  }

  const jsonData = JSON.parse(data);

  const inputArray = ['Ctrl', 'Opt', 'Del', 'Down'];
  const formattedString = generateFormattedString(inputArray, jsonData);
  console.log(formattedString); // Output: "Control+Option+Delete+Down Arrow"
});
