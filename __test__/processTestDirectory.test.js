const { validateTestsKeys, validateAssertionsKeys } = require('../lib/data/process-test-directory');

describe('processTestDirectory', () => {
  describe('validateTestsKeys', () => {
    const validRow = {
      testId: 'navBackToNothing',
      title: `Navigate backwards to a thing that doesn't do anything`,
      presentationNumber: '1.0',
      setupScript: 'doNothing',
      instructions: 'Starting from nowhere, go nowhere.',
      assertions: '0:abc1234567890 abc',
    };

    const invalidRow = {
      ...validRow,
      assertions: `stringAssertion?~<>,./;"'!*&^%$#@()_+={}[]|`,
    };

    it('returns row on valid assertions', () => {
      expect(validateTestsKeys(validRow)).toMatchObject(validRow);
    });

    it('throws on invalid assertions', () => {
      expect(() => validateTestsKeys(invalidRow)).toThrow();
    });

    const validPriority = { ...validRow, assertions: '0:abc 1:abc 2:abc 3:abc' };
    it('returns row on valid priority', () => {
      expect(validateTestsKeys(validPriority)).toMatchObject(validPriority);
    });

    ['0:abc 4:abc', '3:', '4:abc', '5:abc', '6:abc', '7:abc', '8:abc', '9:abc'].forEach(
      assertion => {
        const invalidPriority = { ...validRow, assertions: assertion };
        it('throws on invalid priority', () => {
          expect(() => validateTestsKeys(invalidPriority)).toThrow();
        });
      }
    );

    // TODO: test other validation cases in this function
  });

  describe('validateAssertionsKeys', () => {
    const validRow = {
      assertionId: 'Assertion-Id-0123456789',
      priority: '1',
      assertionStatement: 'A thing is conveyed',
      assertionPhrase: 'convey thing',
    };

    const invalidRow = {
      ...validRow,
      assertionId: `?~<>,./:;"'!*&^%$#@()_+={}[]|1234567890AssertionId `,
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
