/**
 * @typedef TestDecoded
 * @property {string} testId
 * @property {string} title
 * @property {Object.<string, string>} references
 * @property {object} assistiveTech
 * @property {string} assistiveTech.parsed parsed assistive tech id from disk
 * @property {string} assistiveTech.name human readable name of assistive tech
 * @property {string} assistiveTech.key aria-at identification key for assistive tech
 * @property {string} assistiveTech.mode
 * @property {string} task
 * @property {JSScript | null} setupScript
 * @property {string} setupScriptDescription
 * @property {string} instructions
 * @property {object[]} commands
 * @property {string} commands[].id
 * @property {string} commands[].keystroke
 * @property {string} [commands[].extra]
 * @property {object[]} assertions
 * @property {number} assertions[].priority
 * @property {string} assertions[].assertion
 */

/**
 * @typedef SuiteDecoded
 * @property {string} name
 * @property {TestDecoded[]} tests
 * @property {DiskAsset | null} referenceCopy
 * @property {DiskAsset | null} resourceCopy
 */
