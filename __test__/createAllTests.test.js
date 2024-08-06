const path = require('path');
const { rimrafSync } = require('rimraf');
const { getFiles, getFileContent } = require('./utils');

const createAllTests = require('../scripts/create-all-tests/createAllTests');

const __testDirectory__ = path.dirname(__filename);
const mockTestsDirectory = path.join(__testDirectory__, '__mocks__', 'tests');
const buildDirectory = path.join(__testDirectory__, 'build');

describe('V1 test format version', () => {
  beforeEach(() => {
    rimrafSync(buildDirectory);
  });

  it('runs createAllTests successfully (banner)', async () => {
    const testplan = 'banner';
    const config = {
      testsDirectory: mockTestsDirectory,
      buildOutputDirectory: buildDirectory,
      args: {
        testplan,
        testMode: true,
        // validate: true,
        // verbose: true,
      },
    };
    await createAllTests(config);

    const testPlanBuildDirectory = path.join(buildDirectory, 'tests', testplan);
    const htmlAndJsonFiles = getFiles(testPlanBuildDirectory, ['.html', '.json']);

    htmlAndJsonFiles.forEach(filePath => {
      const file = getFileContent(path.join(testPlanBuildDirectory, filePath));
      expect(file).toMatchSnapshot();
    });
  });
});

describe('V2 test format version', () => {
  beforeEach(() => {
    rimrafSync(buildDirectory);
  });

  it('runs createAllTests successfully (alert)', async () => {
    const testplan = 'alert';
    const config = {
      testsDirectory: mockTestsDirectory,
      buildOutputDirectory: buildDirectory,
      args: {
        testplan,
        testMode: true,
        // validate: true,
        // verbose: true,
      },
    };
    await createAllTests(config);

    const testPlanBuildDirectory = path.join(buildDirectory, 'tests', testplan);
    const htmlAndJsonFiles = getFiles(testPlanBuildDirectory, ['.html', '.json']);

    htmlAndJsonFiles.forEach(filePath => {
      const file = getFileContent(path.join(testPlanBuildDirectory, filePath));
      expect(file).toMatchSnapshot();
    });
  });

  it('runs createAllTests successfully (command-button)', async () => {
    const testplan = 'command-button';
    const config = {
      testsDirectory: mockTestsDirectory,
      buildOutputDirectory: buildDirectory,
      args: {
        testplan,
        testMode: true,
        // validate: true,
        // verbose: true,
      },
    };
    await createAllTests(config);

    const testPlanBuildDirectory = path.join(buildDirectory, 'tests', testplan);
    const htmlAndJsonFiles = getFiles(testPlanBuildDirectory, ['.html', '.json']);

    htmlAndJsonFiles.forEach(filePath => {
      const file = getFileContent(path.join(testPlanBuildDirectory, filePath));
      expect(file).toMatchSnapshot();
    });
  });
});
