/**
 * Types of a format of a test result submitted to or received from aria-at-app.
 * @namespace AriaATTestResult
 */

/**
 * @typedef {"REQUIRED"
 *   | "OPTIONAL"} AriaATTestResult.AssertionPriorityJSON
 */

/**
 * @typedef {"INCORRECT_OUTPUT"
 *   | "NO_OUTPUT"} AriaATTestResult.AssertionFailedReasonJSON
 */

/**
 * @typedef AriaATTestResult.JSON
 * @property {object} test
 * @property {string} test.title
 * @property {object} test.at
 * @property {string} test.at.id
 * @property {string} test.atMode
 * @property {object[]} scenarioResults
 * @property {object} scenarioResults[].scenario
 * @property {object} scenarioResults[].scenario.command
 * @property {string} scenarioResults[].scenario.command.id
 * @property {string} scenarioResults[].output
 * @property {object[]} scenarioResults[].assertionResults
 * @property {object} scenarioResults[].assertionResults[].assertion
 * @property {AriaATTestResult.AssertionPriorityJSON} scenarioResults[].assertionResults[].assertion.priority
 * @property {string} scenarioResults[].assertionResults[].assertion.text
 * @property {boolean} scenarioResults[].assertionResults[].passed
 * @property {AriaATTestResult.AssertionFailedReasonJSON | null} [scenarioResults[].assertionResults[].failedReason]
 * @property {object[]} scenarioResults[].unexpectedBehaviors
 * @property {string} scenarioResults[].unexpectedBehaviors[].id
 * @property {string} scenarioResults[].unexpectedBehaviors[].text
 * @property {string | null} [scenarioResults[].unexpectedBehaviors[].otherUnexpectedBehaviorText]
 */
