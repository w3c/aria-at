/**
 * @typedef AutomatedTest
 * @property {object} info
 * @property {string} info.repository
 * @property {string} info.repositoryHash
 * @property {string} info.suite
 * @property {string} info.testId
 * @property {string} info.title
 * @property {string} info.task
 * @property {Object.<string, string>} info.references
 * @property {object} operatingContext
 * @property {string} operatingContext.browser
 * @property {object} operatingContext.assistiveTech
 * @property {string} operatingContext.assistiveTech.name
 * @property {string} operatingContext.assistiveTech.key
 * @property {string} operatingContext.assistiveTech.mode
 * @property {object} test
 * @property {string} test.page
 * @property {JSScript} [test.setupScript]
 * @property {object[]} test.commands
 * @property {string} test.commands[].id
 * @property {string} test.commands[].keystroke
 * @property {string} [test.commands[].extra]
 * @property {object[]} test.assertions
 * @property {number} test.assertions[].priority
 * @property {string} test.assertions[].assertion
 */

/**
 * @typedef AutomatedTestTargetBrowser
 * @property {string} targetBrowser
 */

/**
 * @typedef AutomatedTestAssistiveTech
 * @property {string} withAssistiveTech
 */

/**
 * @typedef AutomatedTestLoadPage
 * @property {string} loadPage
 */

/**
 * @typedef AutomatedTestPerformScript
 * @property {string} performScript
 */

/**
 * @typedef AutomatedTestPerformKeystroke
 * @property {string} performKeystroke
 */

/**
 * @typedef AutomatedTestWaitCondition
 * @property {string} waitUntil
 */

/**
 * @typedef AutomatedTestAssert
 * @property {string} assert
 */

/**
 * @typedef {AutomatedTestAssert | AutomatedTestAssistiveTech | AutomatedTestLoadPage | AutomatedTestPerformKeystroke | AutomatedTestPerformScript | AutomatedTestTargetBrowser | AutomatedTestWaitCondition} AutomatedTestStep
 */

/**
 * @typedef {AutomatedTestStep[]} AutomatedTestSteps
 */

/**
 * @typedef AutomatedSuite
 * @property {string} name
 * @property {object[]} tests
 * @property {AutomatedTest} tests[].data
 * @property {AutomatedTestSteps} tests[].steps
 */
