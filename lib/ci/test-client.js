/**
 * Connect to 1 or more test-hosts and send them tests until all tests have run.
 *
 * - load test group execution state (if recovering from a crash)
 *   - create and save execution state (in case a crash in test-client happens)
 * - find or start test-agent(s)
 * - send tests to test-agent(s)
 *   - receive result from test-agent and record completion in execution state
 *     - submit result
 *   - if test-agent is not responsive, disconnects or crashes
 *     - record issue in execution state, put back in the queue unless exceeding number of retries
 *     - restart test-agent(s) if possible
 * - report summary of results
 *   - time stats
 *   - pass/fail/crash stats
 */

/**
 * @enum {string}
 */
const Status = {
    /** Waiting for an available test-host. */
    QUEUED: 'queued',
    /** Test executing on a test-host. */
    RUNNING: 'running',
    /** Test completed on a test-host, assertions may have passed or failed. */
    FINISHED: 'finished',
    /** Failed to complete the test after multiple retries. */
    FAILED: 'failed',
}

/**
 * @enum {string}
 */
const Reason = {
    /** The test-agent crashed. */
    AGENT_CRASH: 'agentCrash',
    /** The software used by test-agent to perform keystrokes or receive audio crashed. */
    DRIVER_CRASH: 'driverCrash',
    /** The browser the test was running in crashed. */
    BROWSER_CRASH: 'browserCrash',
    /** The requested browser was not available. */
    BROWSER_UNAVAILABLE: 'browserUnavailable',
    /** The requested assistive technology was not available. */
    ASSISTIVE_TECH_UNAVAILABLE: 'assistiveTechUnavailable',
    /** Connection to the test-host timed out. */
    CONNECTION_TIMEOUT: 'connectionTimeout',
}

/**
 * @typedef TestState
 * @property revisionId
 * @property executionId
 * @property status
 * @property status.stage
 * @property status.retriesLeft
 * @property status.retryReasons
 * @property paths
 * @property paths.testFile
 * @property paths.reference
 * @property paths.resourceRoot
 * @property result
 */
