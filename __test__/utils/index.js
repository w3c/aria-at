const fs = require('fs');
const path = require('path');

/**
 * @param {string} directoryPath
 * @param {string[]} extensions - eg. ['.html', '.json']
 * @returns {string[]}
 */
function getFiles(directoryPath, extensions = []) {
  const files = fs.readdirSync(directoryPath);

  // Return all files in directory
  if (!extensions.length) return files;

  // Return only files included in 'extensions'
  return files.filter(file => extensions.includes(path.extname(file).toLowerCase()));
}

function getFileContent(filePath) {
  return fs.readFileSync(filePath, 'utf-8');
}

module.exports = {
  getFiles,
  getFileContent,
};
