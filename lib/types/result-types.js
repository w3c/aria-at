/**
 * @typedef {"PASS" | "FAIL"} ResultStatusJSON
 */

/**
 * @typedef {"FULL" | "FAILING" | "ALL REQUIRED"} ResultCommandSupportJSON
 */

/**
 * @typedef ResultDetailsCommandsAssertionsPass
 * @property {string} assertion
 * @property {string} priority
 * @property {"Good Output"} pass
 */

/**
 * @typedef ResultDetailsCommandsAssertionsFail
 * @property {string} assertion
 * @property {string} priority
 * @property {"No Output" | "Incorrect Output" | "No Support"} fail
 */

/**
 * @typedef {ResultDetailsCommandsAssertionsPass | ResultDetailsCommandsAssertionsFail} ResultAssertionsJSON
 */

/**
 * @typedef ResultSummaryPriorityJSON
 * @property {number} pass
 * @property {number} fail
 */

/**
 * @typedef {{1: ResultSummaryPriorityJSON, 2: ResultSummaryPriorityJSON, unexpectedCount: number}} ResultSummaryJSON
 */

/**
 * @typedef ResultJSON
 * @property {string} test
 * @property {ResultStatusJSON} status
 * @property {object} details
 * @property {string} details.name
 * @property {string} details.specific_user_instruction
 * @property {string} details.task
 * @property {object[]} details.commands
 * @property {string} details.commands[].command
 * @property {string} details.commands[].output
 * @property {ResultAssertionsJSON[]} details.commands[].assertions
 * @property {string[]} details.commands[].unexpected_behaviors
 * @property {ResultCommandSupportJSON} details.commands[].support
 * @property {ResultSummaryJSON} details.summary
 */
