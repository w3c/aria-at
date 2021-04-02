/**
 * @typedef {'NVDA'|'JAWS'|'VoiceOver'} ScreenReader - The screen reader running 
 * the tests.
 */

/**
 * @typedef {Object} Suite - A collection of tests around an HTML example, 
 * typically a pattern from the ARIA Authoring Practices Guide. Note: this object 
 * will be fully fleshed out a future research spike.
 * @property {string} title - A human-readable title for the suite such as 
 * "Checkbox (Two-State)"
 * @property {UnplannedTest[]} unplannedTests
 */

/**
 * @typedef {Object} UnplannedTest - Raw test data that can produce multiple planned 
 * tests once factors such as the tested Screen Reader or key choice are known. 
 * Corresponds to a row in a tests.csv. Note: this object will be fully fleshed out
 * in a future research spike.
 * @property {string} title - A human-readable title such as "Navigate forwards to 
 * an unchecked checkbox in reading mode"
 */

/**
 * @typedef {Object} PlannedTest - An runnable test with a complete set of execution
 * steps. Note: this object will be fully fleshed out in a future research spike.
 * @property {string} title - A human-readable title for the test such as "Navigate 
 * forwards to an unchecked checkbox in reading mode"
 */

/**
 * Get all suites known by the ARIA-AT repo.
 * @returns {Suite[]}
 */
async function getSuites() {
}

/**
 * Get a suite based on its title.
 * @param {Object} options
 * @param {string} options.title - The title of a test suite.
 * @returns {Suite}
 */
async function getSuite(options) {
}

/**
 * Convert an UnplannedTest, which is not executable, into a PlannedTest, which is.
 * @param {UnplannedTest} unplannedTest
 * @param {Object} options
 * @param {ScreenReader} options.screenReader
 * @param {boolean} options.isManuallyTested - Whether the tests are run by humans
 * as opposed to automation.
 * @param {number} options.nthKey - When the test can be completed using multiple
 * keys, this number determines which of the keys to use.
 * @returns {PlannedTest}
 */
async function planTest(unplannedTest, options) {}

/**
 * The result of executing a planned test. Note: this object will be fully fleshed 
 * out in a future research spike.
 * @typedef Result
 */

/**
 * @typedef GitHubIssue
 * @property {string} title
 * @property {string} body
 */

/**
 * Load an issue template, customized for the given test, to simplify the process 
 * of submitting issues to GitHub.
 * @param {PlannedTest}
 * @returns {GitHubIssue}
 */
function startIssue(plannedTest) {}

/**
 * Send the given issue, which has been edited, to GitHub.
 * @param {GitHubIssue} issue
 */
async function sendIssue(issue) {}

/*
const keyChoices = [
  {
    'navigate forwards to checkbox': {
      reading: {
        NVDA: ['X', 'F', 'TAB', 'DOWN'],
        JAWS: ['X', 'F', 'TAB', 'DOWN'],
      },
      interaction: {
        NVDA: ['TAB'],
        JAWS: ['TAB'],
      },
      modeless: {
        VoiceOver: ['VO_DOWN']
      }
    }
  }
]

const test = {
  name: 'Navigate forwards to an unchecked checkbox in reading mode',
  screenReaders: ['NVDA', 'JAWS'],
  nKeys: 4,
  steps: [
    {
      raw: 'press: navigate forwards to checkbox',
      manual: [
        'Press ',
        { keyChoice: 'navigate forwards to checkbox' },
        ' to navigate forwards to checkbox'
      ],
      automated: ['press', { keyChoice: 'navigate forwards to checkbox' }],
    }
  ]
}

const suites = [
  {
    path: 'tests/checkbox',
    title: 'Checkbox (Two State)',
    tests: [
      test1,
      test2,
    ],
  }
]

const renderedTest = { 
  name: 'Navigate forwards to an unchecked checkbox in reading mode',
  screenReader: 'NVDA',
  manuallyRun: true,
  keyChoice: 1,
  steps: [
    'Press DOWN to navigate forwards to checkbox'
  ]
}
*/

