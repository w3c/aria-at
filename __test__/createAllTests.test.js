const path = require('path');
const createAllTests = require('../scripts/create-all-tests/createAllTests');

describe('V1 test format version', () => {
  it('creates tests for v1 test', async () => {
    const __testDirectory__ = path.dirname(__filename);
    const mockTestsDirectory = path.join(__testDirectory__, '__mocks__', 'tests');
    const mockBuildDirectory = path.join(__testDirectory__, 'build');

    const config = {
      testsDirectory: mockTestsDirectory,
      buildOutputDirectory: mockBuildDirectory,
      args: {
        testplan: 'banner',
        // validate: true,
        // verbose: true,
        testMode: true,
      },
    };

    await createAllTests({ config });
  });
});
