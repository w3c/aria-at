const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const git = require("nodegit");
const mustache = require('mustache');
const np = require('node-html-parser');

const tmpPath = path.join(__dirname, "tmp");
const cloneURL = 'https://github.com/w3c/aria-practices'

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
  },
});

if (args.help) {
  console.log(`
Default use:
  node update-reference.js directory
    Will copy the latest example html from aria-practices repo into this repo.
    The directory name needs to match the name of an html file in the examples folder in the aria-practice repo.
    The copied reference will be placed in a dated folder to provide a form of version control for the refernece files.
    The new reference will only be used with the reference.csv file is updated to point to the new reference folder.
  Arguments:
    -h, --help
       Show this message.
`);
  process.exit();
}

if (args._.length !== 1) {
  console.log("Command expects a directory name, please supply.");
  process.exit();
}

function locateFile(startPath, fileToFind) {
    const files = fs.readdirSync(startPath);
    for (let i=0; i < files.length; i++) {
      const filename = path.join(startPath, files[i]);
      const stat = fs.lstatSync(filename);
      if (stat.isDirectory()){
        const result = locateFile(filename, fileToFind);
        if (result) {
          return result;
        }
      } else if (filename.indexOf(fileToFind) >= 0) {
        return filename;
      }
    }
}

function updateReferenceHtmlFile(referenceHtml) {
	const root = np.parse(fse.readFileSync(referenceHtml, 'utf8'), {script: true});
  const head = root.querySelector('head');
  const header = root.querySelector('h1');
  const example = root.querySelector('#ex1');
  const templateFile = path.join(__dirname, 'reference-template.mustache');
  const template = fse.readFileSync(templateFile, 'utf8');
  const rendered = mustache.render(template, { head, header, example });
  fse.writeFileSync(referenceHtml, rendered);
}

async function copyExampleToRepo(exampleName) {
  try {
    await fse.remove(tmpPath);
    console.log('Cloning the aria-practice repo.');
    await git.Clone(cloneURL, tmpPath);
    const examplesPath = path.join(tmpPath, 'examples')
    const htmlFile = exampleName + '.html';
    console.log(`Locating the matching example file ${htmlFile}`);
    const htmlFileAbsolute = locateFile(examplesPath, htmlFile);
    const currentDateTime = new Date();
    const formattedDateTime = currentDateTime.getFullYear() + "-" + (currentDateTime.getMonth() + 1) + "-" + currentDateTime.getDate() + "_" + currentDateTime.getHours() + + currentDateTime.getMinutes() + currentDateTime.getSeconds();
    const referenceDir = path.join(tmpPath, '..', '..', 'tests', exampleName, 'reference', formattedDateTime);
    await fse.ensureDir(referenceDir);
    const filterFunc = (src) => { return (src.indexOf('.html') == -1 || src == htmlFileAbsolute) };
    console.log('Coping assets to timestamped local directory.');
    await fse.copy(path.join(examplesPath, htmlFileAbsolute.split('examples' + path.sep)[1].split(path.sep)[0]), referenceDir, { filter: filterFunc});
    const referenceHtml = locateFile(referenceDir, htmlFile);
    console.log(`Replacing reference html file with templated version\n\n`);
    updateReferenceHtmlFile(referenceHtml);
    const referenceHtmlPath = path.join('reference', referenceHtml.split('reference' + path.sep)[1]);
    console.log(`Reference file created at tests/${exampleName}/${referenceHtmlPath}.\nIf you want to switch the test to run the updated reference, please commit this change and update ${path.join('tests', exampleName, 'data', 'reference.csv')} with the reference ${referenceHtmlPath}.`);
  } finally {
    await fse.remove(tmpPath);
  }
}

copyExampleToRepo(args._[0]);
