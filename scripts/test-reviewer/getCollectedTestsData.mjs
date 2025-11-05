import path from 'path';
import fse from 'fs-extra';
import np from 'node-html-parser';

/**
 * @param {string} testPlanBuildDirectory
 * @param {*[]} referencesData
 * @param aria
 * @param htmlAam
 * @returns {*[]}
 */
function getCollectedTestsData(testPlanBuildDirectory, { referencesData = [], aria, htmlAam }) {
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
        } else {
          // Construct the links using aria and htmlAam for the v2 tests
          const reference = referencesData.find(
            ref =>
              ref.refId === href.trim() ||
              ref.refId === text.trim() ||
              ref.value === href.trim() ||
              ref.value === text.trim()
          );

          if (reference?.type === 'aria') {
            href = `${aria.baseUrl}${aria.fragmentIds[href]}`;
            text = `${text} ${aria.linkText}`;
          }

          if (reference?.type === 'htmlAam') {
            href = `${htmlAam.baseUrl}${htmlAam.fragmentIds[href]}`;
            text = `${text} ${htmlAam.linkText}`;
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
