const { validateTestsKeys, validateAssertionsKeys } = require('../lib/data/process-test-directory');

describe('processTestDirectory', () => {
  describe('validateTestsKeys', () => {
    const validRow = {
      testId: 'navBackToNothing',
      title: `Navigate backwards to a thing that doesn't do anything`,
      presentationNumber: '1.0',
      setupScript: 'doNothing',
      instructions: 'Starting from nowhere, go nowhere.',
      assertions: ':-? 1234567890 stringAssertion assertion-with-characters?:',
    };

    const invalidRow = {
      ...validRow,
      assertions: `~<>,./:;"'!*&^%$#@()_+={}[]| 1234567890 stringAssertion assertion-with-characters?`,
    };

    it('returns row on valid assertions', () => {
      expect(validateTestsKeys(validRow)).toMatchObject(validRow);
    });

    it('throws on invalid assertions', () => {
      expect(() => validateTestsKeys(invalidRow)).toThrow();
    });

    // TODO: test other validation cases in this function
  });

  describe('validateAssertionsKeys', () => {
    const validRow = {
      assertionId: '-?1234567890AssertionId',
      priority: '1',
      assertionStatement: 'A thing is conveyed',
      assertionPhrase: 'convey thing',
    };

    const invalidRow = {
      ...validRow,
      assertionId: `~<>,./:;"'!*&^%$#@()_+={}[]|1234567890AssertionId `,
    };

    it('returns row on valid assertionId', () => {
      expect(validateAssertionsKeys(validRow)).toMatchObject(validRow);
    });

    it('throws on invalid assertionId', () => {
      expect(() => validateAssertionsKeys(invalidRow)).toThrow();
    });

    // TODO: test other validation cases in this function
  });
});
