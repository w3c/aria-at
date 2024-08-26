import path from 'path';
import fse from 'fs-extra';
import np from 'node-html-parser';

/**
 * @param {string} testPlanBuildDirectory
 * @returns {*[]}
 */
function getCollectedTestsData(testPlanBuildDirectory) {
  const collectedTests = [];

  fse.readdirSync(testPlanBuildDirectory).forEach(function (file) {
    // Don't process unless the file is `test-{xx}-{testId}.html`
    if (path.extname(file) !== '.html' || path.basename(file) === 'index.html') return;

    // Ignore `test-{xx}-{testId}-{at}.collected.html`. More information to be collected from
    // `test-{xx}-{testId}.html` file instead
    if (/\.collected\.html$/.test(file)) return;

    const testFile = path.join(testPlanBuildDirectory, file);
    const root = np.parse(fse.readFileSync(testFile, 'utf8'), { script: true });

    // Get testData from test-review-{presentationNumber}-{testId}-{modes}.json
    const testJsonData = JSON.parse(
      fse.readFileSync(path.join(testPlanBuildDirectory, path.parse(file).name + '.json'), 'utf8')
    );

    // Get metadata help links
    const testFullName = root.querySelector('title').innerHTML;
    const helpLinks = [];
    for (let link of root.querySelectorAll('link')) {
      if (link.attributes.rel === 'help') {
        let href = link.attributes.href;
        // V2
        let text = link.attributes.title;

        // V1
        if (!text) {
          if (href.indexOf('#') >= 0) {
            text = `ARIA specification: ${href.split('#')[1]}`;
          } else {
            text = `APG example: ${href.split('examples/')[1]}`;
          }
        }

        helpLinks.push({
          link: href,
          text: text,
        });
      }
    }

    collectedTests.push({ ...testJsonData, test: file, testFullName, helpLinks });
  });

  return collectedTests;
}

export default getCollectedTestsData;
