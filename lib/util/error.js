class InvariantError extends Error {}

class ValidationError extends Error {}

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

const validate = createConditionReporter();

exports.InvariantError = InvariantError;
exports.ValidationError = ValidationError;
exports.invariant = invariant;
exports.validate = validate;

function createErrorMessage(errorMessage) {
  if (typeof errorMessage === 'function') {
    return errorMessage();
  }
  return errorMessage;
}

function createConditionReporter() {
  /** @type {function(ValidationError): void} */
  let reportValidationError = null;

  /**
   * Check that a condition is true (or truthy). If it is not, report an error. If no reporter is
   * configured (with validate.reportTo), the error is thrown.
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
     * @param {function(): T} reportingScope
     * @returns {T}
     * @template T
     */
    reportTo(reportError, reportingScope) {
      const last = reportValidationError;
      reportValidationError = reportError;

      try {
        return reportingScope();
      } finally {
        invariant(
          reportValidationError === reportError,
          `'validate' reporter changed out of order`
        );
        reportValidationError = last;
      }
    },
  });
}

/**
 * @typedef {function(): string} ErrorMessageGenerator
 */

/**
 * @typedef {string | ErrorMessageGenerator} ErrorMessageLike
 */
