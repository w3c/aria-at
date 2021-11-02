/**
 * Data collected from multiple input sources and validated against each other.
 * @namespace AriaATValidated
 */

/**
 * @typedef AriaATValidated.Command
 * @property {number} testId
 * @property {string} task
 * @property {object} target
 * @property {object} target.at
 * @property {string} target.at.key
 * @property {string} target.at.raw
 * @property {string} target.mode
 * @property {object[]} commands
 * @property {string} commands[].id
 * @property {string} commands[].keystroke
 * @property {object[]} commands[].keypresses
 * @property {string} commands[].keypresses[].id
 * @property {string} commands[].keypresses[].keystroke
 * @property {string} [commands[].extraInstruction]
 */

/**
 * @typedef AriaATValidated.Test
 * @property {number} testId
 * @property {string} task
 * @property {string} title
 * @property {object} target
 * @property {object[]} target.at
 * @property {string} target.at[].key
 * @property {string} target.at[].name
 * @property {string} target.at[].raw
 * @property {string} target.mode
 * @property {object} [setupScript]
 * @property {string} setupScript.name
 * @property {string} setupScript.description
 * @property {string} setupScript.source
 * @property {string} setupScript.modulePath
 * @property {string} setupScript.jsonpPath
 * @property {object[]} references
 * @property {string} references[].refId
 * @property {string} references[].value
 * @property {object} instructions
 * @property {string[]} instructions.user
 * @property {string} instructions.raw
 * @property {object[]} assertions
 * @property {1 | 2} assertions[].priority
 * @property {string} assertions[].expectation
 */
