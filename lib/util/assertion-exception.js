/**
 * Generates the assertionException string with a default priority prefix
 * @param {String} assertionException
 * @param {Number} defaultPriority
 * @returns {String}
 */
function setDefaultAssertionException(assertionException, defaultPriority) {
  if (assertionException && !assertionException.includes(':')) {
    return `${defaultPriority}:${assertionException}`;
  }
  return assertionException;
}

/**
 * Finds the default assertion value for an assertionException without
 * a priority prefix in a string of assertionExceptions and recreates
 * the string with the new default assertion priorities
 * @param {String} assertionExceptions
 * @param {Array} assertions
 * @returns {String}
 */
function setDefaultAssertionPriority(assertionExceptions, assertions) {
  return assertionExceptions
    .split(' ')
    .map(assertionException => {
      const assertion = assertions.find(assertion =>
        assertionException.includes(assertion.assertionId)
      );
      if (assertion) {
        const defaultPriority = assertion.priority;
        return setDefaultAssertionException(assertionException, defaultPriority);
      }
      return assertionException;
    })
    .join(' ');
}

exports.setDefaultAssertionPriority = setDefaultAssertionPriority;
