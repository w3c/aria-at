/** @namespace AriaATTestRun */

/**
 * @typedef {"reading"
 *   | "interaction"} AriaATTestRun.ATMode
 */

/**
 * @typedef {"loadPage"
 *   | "openTestWindow"
 *   | "closeTestWindow"
 *   | "validateResults"
 *   | "changeText"
 *   | "changeSelection"
 *   | "showResults"} AriaATTestRun.UserActionName
 */

/**
 * @typedef {"focusUnexpected"} AriaATTestRun.UserActionObjectName
 */

/**
 * @typedef AriaATTestRun.UserActionFocusUnexpected
 * @property {"focusUnexpected"} action
 * @property {number} commandIndex
 * @property {number} unexpectedIndex
 */

/**
 * @typedef {AriaATTestRun.UserActionName
 *   | AriaATTestRun.UserActionFocusUnexpected} AriaATTestRun.UserAction
 */

/**
 * @typedef {"notSet"
 *   | "pass"
 *   | "failMissing"
 *   | "failIncorrect"} AriaATTestRun.AssertionResult
 */

/**
 * @typedef {"notSet"
 *   | "pass"
 *   | "failSupport"} AriaATTestRun.AdditionalAssertionResult
 */

/**
 * @typedef {"notSet"
 *   | "hasUnexpected"
 *   | "doesNotHaveUnexpected"} AriaATTestRun.HasUnexpectedBehavior
 */

/**
 * @typedef AriaATTestRun.State
 * This state contains all the serializable values that are needed to render any of the documents (InstructionDocument,
 * ResultsTableDocument, and TestPageDocument) from the test-run module.
 *
 * @property {string[] | null} errors
 * @property {object} info
 * @property {string} info.description
 * @property {string} info.task
 * @property {AriaATTestRun.ATMode} info.mode
 * @property {string} info.modeInstructions
 * @property {string[]} info.userInstructions
 * @property {string} info.setupScriptDescription
 * @property {object} config
 * @property {object} config.at
 * @property {string} config.at.key
 * @property {string} config.at.name
 * @property {boolean} config.renderResultsAfterSubmit
 * @property {boolean} config.displaySubmitButton
 * @property {AriaATTestRun.UserAction} currentUserAction
 * @property {object[]} commands
 * @property {string} commands[].description
 * @property {object} commands[].atOutput
 * @property {boolean} commands[].atOutput.highlightRequired
 * @property {string} commands[].atOutput.value
 * @property {object[]} commands[].assertions
 * @property {string} commands[].assertions[].description
 * @property {boolean} commands[].assertions[].highlightRequired
 * @property {number} commands[].assertions[].priority
 * @property {AriaATTestRun.AssertionResult} commands[].assertions[].result
 * @property {object[]} commands[].additionalAssertions
 * @property {string} commands[].additionalAssertions[].description
 * @property {boolean} commands[].additionalAssertions[].highlightRequired
 * @property {number} commands[].additionalAssertions[].priority
 * @property {AriaATTestRun.AdditionalAssertionResult} commands[].additionalAssertions[].result
 * @property {object} commands[].unexpected
 * @property {boolean} commands[].unexpected.highlightRequired
 * @property {AriaATTestRun.HasUnexpectedBehavior} commands[].unexpected.hasUnexpected
 * @property {number} commands[].unexpected.tabbedBehavior
 * @property {object[]} commands[].unexpected.behaviors
 * @property {string} commands[].unexpected.behaviors[].description
 * @property {boolean} commands[].unexpected.behaviors[].checked
 * @property {object} [commands[].unexpected.behaviors[].more]
 * @property {boolean} commands[].unexpected.behaviors[].more.highlightRequired
 * @property {string} commands[].unexpected.behaviors[].more.value
 * @property {object} openTest
 * @property {boolean} openTest.enabled
 */
