const fs = require('fs');
const fse = require('fs-extra');
const path = require('path');
const git = require("nodegit");
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
    console.log('Coping the located file to timestamped local directory.\n\n');
    await fse.copy(path.join(examplesPath, htmlFileAbsolute.split('examples/')[1].split('/')[0]), referenceDir, { filter: filterFunc});
    const referenceHtml = `reference/${formattedDateTime}/${htmlFileAbsolute.split('examples/')[1]}`;
    console.log(`Reference file copied to tests/${exampleName}/${referenceHtml}.\nIf you want to switch the test to run the updated reference, please commit this change and update tests/${exampleName}/data/reference.csv with the reference ${referenceHtml}.`);
  } finally {
    await fse.remove(tmpPath);
  }
}

copyExampleToRepo(args._[0]);
