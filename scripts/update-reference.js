const path = require('path');
const fse = require('fs-extra');
const simpleGit = require('simple-git');

const cloneURL = 'https://github.com/w3c/aria-practices';
const apgPath = path.join(__dirname, 'aria-practices');
let apgRepositoryBasePath = apgPath;

const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    r: 'aria-practices-directory',
  },
});

if (args.help) {
  console.log(`
Default use:
  node update-reference.js exampleName [-r ariaPracticesDirectory]
    It will copy the latest example html from the aria-practices repository into this repository.
    It will clone the latest aria-practices directory or use an existing clone.
    The example html url for the example needs to be specified in the references.csv file for the example named.
    The copied reference will be placed in a dated folder to provide a form of version control for the reference files.
    The new reference will only be used when the reference.csv file, reference value is updated to point to the new reference folder.
  Arguments:
    -r, --aria-practices-directory
    -h, --help
       Show this message.
`);
  process.exit();
}

if (args._.length !== 1) {
  console.log('Command expects a directory name, please supply.');
  process.exit();
}

function locateFile(startPath, fileToFind) {
  const files = fse.readdirSync(startPath);
  for (let i = 0; i < files.length; i++) {
    const filename = path.join(startPath, files[i]);
    const stat = fse.lstatSync(filename);
    if (stat.isDirectory()) {
      const result = locateFile(filename, fileToFind);
      if (result) {
        return result;
      }
    } else if (filename.indexOf(fileToFind) >= 0) {
      return filename;
    }
  }
}

/**
 * Zero dependency path normalizer that uses 'path' to return a path string which only uses 'forward' slashes
 * @param {string} pathString - path string to be converted if required
 * @returns {string} - a path string that prioritises the use of path separators being a 'forward' slash instead of a 'backward' slash
 */
function posixPath(pathString) {
  return pathString.split(path.sep).join(path.posix.sep);
}

async function copyExampleToRepo(exampleName) {
  try {
    const testDirectory = path.join('tests', exampleName);
    try {
      fse.statSync(testDirectory);
    } catch (err) {
      console.log(
        `The test directory '${posixPath(
          testDirectory
        )}' does not exist. Please enure the provide path name was correct.`
      );
      process.exit();
    }

    const referencesCsvFile = path.join(testDirectory, 'data', 'references.csv');
    try {
      fse.statSync(referencesCsvFile);
    } catch (err) {
      console.log(
        "The references.csv file does not exist. Please create '" + referencesCsvFile + "' file."
      );
      process.exit();
    }
    const referencesCsv = fse.readFileSync(referencesCsvFile, 'UTF-8');
    let exampleUrl = (
      (referencesCsv || '').split(/\r?\n/).find(s => s.startsWith('example,')) || ''
    ).split(',')[1];

    // TODO: Deprecate this when all tests support the v2 format
    // If v2 test format
    if (exampleUrl === 'metadata')
      exampleUrl = (
        (referencesCsv || '').split(/\r?\n/).find(s => s.startsWith('example,')) || ''
      ).split(',')[2];

    if (!exampleUrl) {
      console.log('`example` must be defined in the references.csv file');
      process.exit();
    }

    // TODO: Deprecate this when all references.csv examples use the w3.org/WAI/ARIA/apg links
    // Supporting older content; but recommend switching over to prevent future issues
    let updatedExampleUrl;
    if (exampleUrl.includes('https://w3c.github.io/aria-practices/')) {
      const oldApgBaseUrl = exampleUrl.includes('/landmarks/')
        ? 'https://w3c.github.io/aria-practices/examples/landmarks/'
        : 'https://w3c.github.io/aria-practices/examples/';

      const waiBaseUrl = exampleUrl.includes('/landmarks/')
        ? 'https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/'
        : 'https://www.w3.org/WAI/ARIA/apg/patterns/';

      updatedExampleUrl = exampleUrl
        .replace(oldApgBaseUrl, waiBaseUrl)
        // All index.html from the older example folders are now {exampleName}.html
        .replace('index.html', `${exampleName}.html`);

      if (exampleUrl.includes('/landmarks/')) {
        // Eg: https://w3c.github.io/aria-practices/examples/landmarks/banner.html to
        //     https://www.w3.org/WAI/ARIA/apg/patterns/landmarks/examples/banner.html
        // Nothing further required
      } else {
        // Eg: https://w3c.github.io/aria-practices/examples/alert/alert.html to
        //     https://www.w3.org/WAI/ARIA/apg/patterns/alert/examples/alert.html
        let examplePathToUpdate = updatedExampleUrl.split(waiBaseUrl)[1];

        const insertIndex = examplePathToUpdate.indexOf('/');
        if (insertIndex > -1)
          examplePathToUpdate =
            examplePathToUpdate.substring(0, insertIndex) +
            '/examples' +
            examplePathToUpdate.substring(insertIndex);

        updatedExampleUrl = waiBaseUrl + examplePathToUpdate;
      }

      console.log(
        'Converting example url found for ' +
          exampleName +
          ', from "' +
          exampleUrl +
          '" to "' +
          updatedExampleUrl +
          '".\nPlease update the url found in tests/' +
          exampleName +
          '/data/references.csv to the latest known location to avoid future issues when running this script.\n'
      );

      exampleUrl = updatedExampleUrl;
    }

    // Url paths on w3.org/WAI/ARIA/apg expected to end in .html get redirected to the same url without .html
    // Eg: https://www.w3.org/WAI/ARIA/apg/patterns/alert/examples/alert.html becomes
    //     https://www.w3.org/WAI/ARIA/apg/patterns/alert/examples/alert/
    //
    // The latter is most likely what test authors will include here since the
    // url is being copied directly from w3.org/WAI/ARIA/apg
    if (exampleUrl.charAt(exampleUrl.length - 1) === '/') {
      exampleUrl = exampleUrl.slice(0, -1) + '.html';
    }

    let examplePath;
    if (exampleUrl.indexOf('https://www.w3.org/WAI/ARIA/apg/patterns/') >= 0) {
      examplePath = exampleUrl.split('https://www.w3.org/WAI/ARIA/apg/')[1];
      examplePath = path.join('content', ...examplePath.split('/')); // Ensure path type is correct regardless of OS
    } else {
      console.log(
        '`example` must be defined in references.csv with the format `https://w3c.github.io/aria-practices/examples/<PATH_TO_EXAMPLE>.html`'
      );
      process.exit();
    }

    if (!args.r) {
      await fse.remove(apgPath);
      console.log('Cloning w3c/aria-practices repository ...');
      const git = simpleGit();
      await git.clone(cloneURL, apgPath);
    } else {
      apgRepositoryBasePath = args.r;
    }

    const htmlFileAbsolute = path.join(apgRepositoryBasePath, examplePath);
    console.log(`Locating the matching example file ${posixPath(htmlFileAbsolute)} ...`);
    try {
      fse.statSync(htmlFileAbsolute);
    } catch (err) {
      console.log(
        `The example html file '${posixPath(
          htmlFileAbsolute
        )}' does not exist. Please ensure the correct example html path is in references.csv.`
      );
      await fse.remove(apgPath);
      process.exit();
    }

    const currentDateTime = new Date();
    const formattedDateTime =
      currentDateTime.getFullYear() +
      '-' +
      (currentDateTime.getMonth() + 1) +
      '-' +
      currentDateTime.getDate() +
      '_' +
      currentDateTime.getHours() +
      +currentDateTime.getMinutes() +
      currentDateTime.getSeconds();
    const referenceDir = path.join(
      apgPath,
      '..',
      '..',
      'tests',
      exampleName,
      'reference',
      formattedDateTime
    );
    await fse.ensureDir(referenceDir);
    const filterFunc = src => {
      return src.indexOf('.html') === -1 || src === htmlFileAbsolute;
    };

    const pathAfterPatterns = htmlFileAbsolute.split(`patterns${path.sep}`)[1];
    const pathToExamples = pathAfterPatterns.substring(0, pathAfterPatterns.lastIndexOf(path.sep));

    await fse.copy(
      path.join(apgRepositoryBasePath, 'content', 'patterns', pathToExamples),
      referenceDir,
      {
        filter: filterFunc,
      }
    );

    const referenceHtml = locateFile(referenceDir, path.basename(examplePath));
    const referenceHtmlPath = path.join(
      'reference',
      referenceHtml.split(`reference${path.sep}`)[1]
    );
    console.log(`Reference files created at ${posixPath(
      `tests/${exampleName}/${referenceHtmlPath}`
    )}.\n
To switch the tests to run the updated reference:
\t1. Update ${posixPath(
      path.join('tests', exampleName, 'data', 'references.csv')
    )} reference value with ${posixPath(referenceHtmlPath)}.
\t2. Open the html file and edit it to only include the example. The title, imported assets, h1 with the example name, and the div with the actual example (Usually #ex1) need to be preserved, but everything else can be removed.
\t3. Run npm run build --testplan=${exampleName}, to generate variations of the the new reference example with the setupScript values defined in ${posixPath(
      path.join('tests', exampleName, 'data', 'tests.csv')
    )}.
\t4. Commit these changes.`);
  } finally {
    await fse.remove(apgPath);
  }
}

copyExampleToRepo(args._[0]);
