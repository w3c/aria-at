module.exports = {
  testRegex: '(/__tests__/.*|(\\.|/)(test|spec))\\.(js?|tsx?|ts?)$',
  transform: {
    '^.+\\.mjs$': 'babel-jest',
  },
  testPathIgnorePatterns: ['<rootDir>/build/', '<rootDir>/node_modules/'],
  moduleFileExtensions: ['js', 'mjs'],
};
