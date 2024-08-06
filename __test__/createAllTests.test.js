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

  it('creates build files for v1 test (banner)', async () => {
    const bannerBuildDirectory = path.join(buildDirectory, 'tests', 'banner');

    const config = {
      testsDirectory: mockTestsDirectory,
      buildOutputDirectory: buildDirectory,
      args: {
        testplan: 'banner',
        // validate: true,
        // verbose: true,
        testMode: true,
      },
    };
    await createAllTests(config);

    const htmlAndJsonFiles = getFiles(bannerBuildDirectory, ['.html', '.json']);

    htmlAndJsonFiles.forEach(filePath => {
      const file = getFileContent(path.join(bannerBuildDirectory, filePath));
      expect(file).toMatchSnapshot();
    });
  });
});
