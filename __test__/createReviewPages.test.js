const path = require('path');
const { rimrafSync } = require('rimraf');
const { getFiles, getFileContent } = require('./utils');
const createAllTests = require('../scripts/create-all-tests/createAllTests');
const createReviewPages =
  require('../scripts/test-reviewer/createReviewPages.mjs').createReviewPages;

const __testDirectory__ = path.dirname(__filename);
const mockTestsDirectory = path.join(__testDirectory__, '__mocks__', 'tests');
const buildDirectory = path.join(__testDirectory__, 'build');

const defaultArgs = {
  testMode: true,
};

const defaultConfig = {
  testsDirectory: mockTestsDirectory,
  buildOutputDirectory: buildDirectory,
  args: defaultArgs,
};

const getReviewFiles = (testPlan, extensions = ['.html', '.json', '.js']) => {
  const reviewBuildDirectory = path.join(buildDirectory, 'review');
  const fileNames = getFiles(reviewBuildDirectory, extensions);

  return [
    // Also get build/index.html
    getFileContent(path.join(buildDirectory, 'index.html')),
    ...fileNames.map(filePath => getFileContent(path.join(reviewBuildDirectory, filePath))),
  ];
};

beforeEach(() => {
  rimrafSync(buildDirectory);
});

describe('review pages creation', () => {
  it('runs createReviewPages successfully for v1 tests (banner)', async () => {
    const testplan = 'banner';
    const config = { ...defaultConfig, args: { ...defaultArgs, testplan } };
    await createAllTests(config);
    createReviewPages(config);

    const files = getReviewFiles(testplan);
    files.forEach(file => expect(file).toMatchSnapshot());
  });

  it('runs createReviewPages successfully for v2 tests (alert)', async () => {
    const testplan = 'alert';
    const config = { ...defaultConfig, args: { ...defaultArgs, testplan } };
    await createAllTests(config);
    createReviewPages(config);

    const files = getReviewFiles(testplan);
    files.forEach(file => expect(file).toMatchSnapshot());
  });

  it('runs createReviewPages successfully for v2 tests (command-button)', async () => {
    const testplan = 'command-button';
    const config = { ...defaultConfig, args: { ...defaultArgs, testplan } };
    await createAllTests(config);
    createReviewPages(config);

    const files = getReviewFiles(testplan);
    files.forEach(file => expect(file).toMatchSnapshot());
  });

  it('runs createReviewPages successfully for all test format versions', async () => {
    const config = { ...defaultConfig, args: { ...defaultArgs } };
    await createAllTests(config);
    createReviewPages(config);

    const files = [
      ...getReviewFiles('alert'),
      ...getReviewFiles('banner'),
      ...getReviewFiles('command-button'),
    ];
    files.forEach(file => expect(file).toMatchSnapshot());
  });
});
