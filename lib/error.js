class InvariantError extends Error {}

class ValidationError extends Error {}

function createErrorMessage(errorMessage) {
  if (typeof errorMessage === 'function') {
    return errorMessage();
  }
  return errorMessage;
}

/**
 * Check that a condition is true (or truthy). If it is not, throw an error.
 * @param {*} condition
 * @param {ErrorMessageLike} errorMessage Create a message when the condition is not good.
 */
function invariant(condition, errorMessage) {
  if (!condition) {
    throw new InvariantError(createErrorMessage(errorMessage));
  }
}

const validate = (() => {
  /** @type {function(ValidationError): void} */
  let reportValidationError = null;

  /**
   * Check that a condition is true (or truthy). If it is not, report it. If reporting outside of a reporting scope, the error is thrown.
   * @param {*} condition
   * @param {ErrorMessageLike} errorMessage
   */
  function validate(condition, errorMessage) {
    if (!condition) {
      const err = new ValidationError(createErrorMessage(errorMessage));
      if (reportValidationError) {
        reportValidationError(err);
      } else {
        throw err;
      }
    }
  }

  return Object.assign(validate, {
    /**
     * @param {function(ValidationError): void} reportError
     * @param {function(): PromiseLike<void> | void} reportingScope
     */
    async reportTo(reportError, reportingScope) {
      const last = reportValidationError;
      reportValidationError = reportError;
      await reportingScope();
      invariant(reportValidationError === reportError, `'validate' reporter changed out of order`);
      reportValidationError = last;
    },
  });
})();

exports.InvariantError = InvariantError;
exports.ValidationError = ValidationError;
exports.invariant = invariant;
exports.validate = validate;

/**
 * @typedef {function(): string} ErrorMessageGenerator
 */

/**
 * @typedef {string | ErrorMessageGenerator} ErrorMessageLike
 */
