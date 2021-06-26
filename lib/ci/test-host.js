/**
 * Start a test-agent child process and wait for tests to execute from a
 * test-client. The test-host process itself is separate from the client and
 * agent. can inform test-client if say test-agent crashes.
 *
 * - start agent
 * - inform agent-daemon that it is starting
 * - inform agent-daemon of available filters
 * - inform agent-daemon that it is available
 * - inform agent-daemon that it is busy
 * - inform agent-daemon that it is waiting on client
 * - inform agent-daemon that it is stopping
 */

/**
 * @typedef ClientSystemRequest
 * @property {"system"} request
 */

/**
 * @typedef ClientStartTestRequest
 * @property {"system"} startTest
 * @property {*} info
 * @property {Array} testSteps
 */

/**
 * @typedef ClientCancelTestRequest
 * @property {"system"} request
 */

/**
 * @typedef ClientGoodbyeRequest
 * @property {"goodbye"} request
 */

/**
 * @typedef ClientSystemResponse
 * @property {"system"} response
 * @property {"starting" | "available" | "busy" | "stopping"} status
 * @property {string[]} browsers
 * @property {string[]} assistiveTech
 */

/**
 * @typedef ClientHelloResponse
 * @property {"hello"} response
 */

/**
 * @typedef ClientBusyResponse
 * @property {"busy"} response
 */

/**
 * @typedef ClientGoodbyeResponse
 * @property {"goodbye"} response
 */

/**
 * @typedef ClientTestProgressResponse
 * @property {"testProgress"} response
 * @property {"starting" | "running" | "finished"} stage
 * @property {*} activeStep
 * @property {number} activeStepIndex
 * @property {number} testStepCount
 * @property {*} results
 */

/**
 * @typedef ClientTestErrorResponse
 * @property {"testError"} response
 * @property {"agentCrash" | "driverCrash" | "browserCrash"} error
 * @property {*} details
 */

/**
 * @typedef ClientReadyResponse
 * @property {"ready"} response
 */

/**
 * @typedef HostOptions
 */
