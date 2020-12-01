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
  node update-reference.js exampleName
    Will copy the latest example html from aria-practices repo into this repo.
    The example html url for the example needs to be specificed in the references.csv file for the example named.
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

async function copyExampleToRepo(exampleName) {
  try {
    const testDirectory = path.join('tests', exampleName);
    try {
      fse.statSync(testDirectory);
    }
    catch (err) {
      console.log("The test directory '" + testDirectory + "' does not exist. Please enure the provide path name was correct.");
      process.exit();
    }

    const referencesCsvFile = path.join(testDirectory, 'data', 'references.csv');
    try {
      fse.statSync(referencesCsvFile);
    }
    catch (err) {
      console.log("The references.csv file does not exist. Please create '" + referencesCsvFile + "' file.");
      process.exit();
    }
    const referencesCsv = fs.readFileSync(referencesCsvFile, 'UTF-8');
    const exampleUrl = ((referencesCsv || '').split(/\r?\n/).find(s => s.startsWith('example,')) || '').split(',')[1];
    if (!exampleUrl) {
      console.log('`example` must be defined in the references.csv file');
      process.exit();
    }
    let examplePath;
    if (exampleUrl.indexOf('https://w3c.github.io/aria-practices/examples/') >= 0) {
      examplePath = exampleUrl.split('https://w3c.github.io/aria-practices/')[1];
      examplePath = path.join(...examplePath.split('/')); // Ensure path type is correct regardless of OS
    } else {
      console.log('`example` must be defined in references.csv with the format `https://w3c.github.io/aria-practices/examples/<PATH_TO_EXAMPLE>.html`');
      process.exit();
    }
    await fse.remove(tmpPath);
    console.log('Cloning the aria-practice repo.');
    await git.Clone(cloneURL, tmpPath);
    console.log(`Locating the matching example file ${examplePath}.`);

    try {
      fse.statSync(path.join(tmpPath, examplePath));
    }
    catch (err) {
      console.log("The example html '" + examplePath + "' does not exist. Please enure the current example html utl is in the references.csv file.");
      process.exit();
    }

    const htmlFileAbsolute = path.join(tmpPath, examplePath);
    const currentDateTime = new Date();
    const formattedDateTime = currentDateTime.getFullYear() + "-" + (currentDateTime.getMonth() + 1) + "-" + currentDateTime.getDate() + "_" + currentDateTime.getHours() + + currentDateTime.getMinutes() + currentDateTime.getSeconds();
    const referenceDir = path.join(tmpPath, '..', '..', 'tests', exampleName, 'reference', formattedDateTime);
    await fse.ensureDir(referenceDir);
    const filterFunc = (src) => { return (src.indexOf('.html') == -1 || src == htmlFileAbsolute) };
    console.log('Coping assets to timestamped local directory.\n\n');
    await fse.copy(path.join(tmpPath, 'examples', htmlFileAbsolute.split('examples' + path.sep)[1].split(path.sep)[0]), referenceDir, { filter: filterFunc});
    const referenceHtml = locateFile(referenceDir, path.basename(examplePath));
    const referenceHtmlPath = path.join('reference', referenceHtml.split('reference' + path.sep)[1]);
    console.log(`Reference file created at tests/${exampleName}/${referenceHtmlPath}.\nTo switch the test to run the updated reference:\n\t1. Commit this change\n\t2. Update ${path.join('tests', exampleName, 'data', 'reference.csv')} with the reference ${referenceHtmlPath}\n\t3. Open the html file and edit it to only include the example. The title, imported assets, h1 with the example name, and the div with the actual example (Usually #ex1) need to be preserved, but everything else can be removed.`);
  } finally {
    await fse.remove(tmpPath);
  }
}

copyExampleToRepo(args._[0]);
