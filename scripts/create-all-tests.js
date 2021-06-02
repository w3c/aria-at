const path = require('path');
const fs = require('fs');
const { createExampleTests } = require('./create-example-tests');

const scriptsDirectory = path.dirname(__filename);
const rootDirectory = scriptsDirectory.split('scripts')[0];

const testsDirectory = path.join(rootDirectory, 'tests');

fs.readdirSync(testsDirectory)
  .filter(f => f !== 'resources' && fs.statSync(path.join(testsDirectory, f)).isDirectory())
  .forEach((d, index, array) => createExampleTests(path.join('tests', d), index === array.length - 1));
