const path = require('path');
const { rimrafSync } = require('rimraf');
const { getFiles, getFileContent } = require('./utils');

const createAllTests = require('../scripts/create-all-tests/createAllTests');

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

const getBuildFiles = (testPlan, extensions = ['.html', '.json', '.js']) => {
  const testPlanBuildDirectory = path.join(buildDirectory, 'tests', testPlan);
  const fileNames = getFiles(testPlanBuildDirectory, extensions);

  return fileNames.map(filePath => getFileContent(path.join(testPlanBuildDirectory, filePath)));
};

beforeEach(() => {
  rimrafSync(buildDirectory);
});

afterAll(() => {
  rimrafSync(buildDirectory);
});

describe('V1 test format version', () => {
  it('runs createAllTests successfully (banner)', async () => {
    const testplan = 'banner';
    const config = { ...defaultConfig, args: { ...defaultArgs, testplan } };
    await createAllTests(config);

    const files = getBuildFiles(testplan);
    files.forEach(file => expect(file).toMatchSnapshot());
  });
});

describe('V2 test format version', () => {
  it('runs createAllTests successfully (alert)', async () => {
    const testplan = 'alert';
    const config = { ...defaultConfig, args: { ...defaultArgs, testplan } };
    await createAllTests(config);

    const files = getBuildFiles(testplan);
    files.forEach(file => expect(file).toMatchSnapshot());
  });

  it('runs createAllTests successfully (command-button)', async () => {
    const testplan = 'command-button';
    const config = { ...defaultConfig, args: { ...defaultArgs, testplan } };
    await createAllTests(config);

    const files = getBuildFiles(testplan);
    files.forEach(file => expect(file).toMatchSnapshot());
  });

  it('runs createAllTests successfully (horizontal-slider)', async () => {
    const testplan = 'horizontal-slider';
    const config = { ...defaultConfig, args: { ...defaultArgs, testplan } };
    await createAllTests(config);

    const files = getBuildFiles(testplan);
    files.forEach(file => expect(file).toMatchSnapshot());
  });
});

describe('all test format versions', () => {
  it('runs createAllTests successfully', async () => {
    const config = { ...defaultConfig, args: { ...defaultArgs, verbose: true } };
    await createAllTests(config);

    const files = [
      ...getBuildFiles('alert'),
      ...getBuildFiles('banner'),
      ...getBuildFiles('command-button'),
      ...getBuildFiles('horizontal-slider'),
    ];
    files.forEach(file => expect(file).toMatchSnapshot());
  });
});
