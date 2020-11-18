// test subdirectory name should be an argument
// test subdirectory should match the directory structure and naming on on apg
// IF there is no reference:
//    - Download the references
//    - Add hash to the end of the names of the html files
//    - Update the references.csv file
//
// IF there is a matching reference
//    - Check if there is a diff
//    - IF there is a diff
//      - Ask if the user want do do an update or not
//      - Present the diff
//      - IF they want to do an update
//          - peform the update
//      - IF they don't want to do an update exit
//    - IF there is is no diff exit
//
//
// NOTE: Handle both nested and non-nests apg examples
//
// NOTE: Provide an error if there is not matching reference
//
//
// Example of nested directory:
// checkbox -> checkbox-1
// https://github.com/w3c/aria-practices/blob/master/examples/checkbox/checkbox-1/checkbox-1.html
// css is a folder up!!!!!
// js is in the same folder
//
// Example of a non-nested directory:
// combobox-autocomplete-both
// https://github.com/w3c/aria-practices/blob/master/examples/combobox/combobox-autocomplete-both.html
// JS and CSS are one folder up
//
// menubar-editor
// https://github.com/w3c/aria-practices/blob/master/examples/menubar/menubar-editor.html
//
//
// Clone the repo locally
// Find the matching file
// Mkdir with a date and copy in the relvant files
//
//
const fs = require('fs');
const path = require('path');
const NodeGit = require("nodegit");
const localPath = path.join(__dirname, "tmp");
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
    var files = fs.readdirSync(startPath);
    for(var i=0;i<files.length;i++){
      var filename=path.join(startPath,files[i]);
      var stat = fs.lstatSync(filename);
      if (stat.isDirectory()){
        locateFile(filename, fileToFind); //recurse
      } else if (filename.indexOf(fileToFind)>=0) {
        return filename;
      }
    }
}

async function copyExampleToRepo(exampleName) {
  try {
    fs.rmdirSync(localPath, { recursive: true });
    await NodeGit.Clone(cloneURL, localPath);
    locateFile(path.join(localPath, 'examples'), exampleName + '.html');
  } finally {
    fs.rmdirSync(localPath, { recursive: true });
  }
}

copyExampleToRepo(args._[0]);
