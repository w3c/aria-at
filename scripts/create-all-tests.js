const path = require('path');
const fs = require('fs');
const { createExampleTests } = require('./create-example-tests');

const scriptDirectory = path.dirname(__filename);
const rootDirectory = scriptDirectory.split('scripts')[0];

const p = path.join(rootDirectory, 'tests');

fs.readdirSync(p)
  .filter(f => f !== 'resources' && fs.statSync(path.join(p, f)).isDirectory())
  .forEach((d, index, array) => createExampleTests(path.join('tests', d), index === array.length - 1));
