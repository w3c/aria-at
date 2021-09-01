/// <reference path="./aria-at-csv.js" />

/**
 * Data written by scripts as json or used to render another format like HTML.
 * @namespace AriaATFile
 */

/**
 * @typedef AriaATFile.AT
 * @property {string} name
 * @property {string} key
 */

/**
 * @typedef AriaATFile.Support
 * @property {object[]} ats
 * @property {string} ats[].name
 * @property {string} ats[].key
 * @property {object} applies_to
 * @property {string[]} applies_to.system
 * @property {object[]} examples
 * @property {string} examples[].directory
 * @property {string} examples[].name
 */

/**
 * 1 or 2 member tuples of strings.
 * @typedef {string[]} AriaATFile.CommandAT
 */

/**
 * @typedef {Object<string, AriaATFile.CommandAT[]>} AriaATFile.CommandMode
 */

/** @typedef {"reading" | "interaction"} AriaATFile.ATMode */

/**
 * @typedef AriaATFile.Command
 * @property {AriaATFile.CommandMode} [reading]
 * @property {AriaATFile.CommandMode} [interaction]
 */

/**
 * An object with keys that have sentence-long descriptions of their value.
 * @typedef {Object<string, AriaATFile.Command>} AriaATFile.CommandStore
 */

/**
 * @typedef {number | string} AriaATFile.StringNumber
 */

/**
 * @typedef AriaATFile.Behavior
 * @property {string} setup_script_description
 * @property {string} setupTestPage
 * @property {string[]} applies_to
 * @property {AriaATFile.ATMode | AriaATFile.ATMode[]} mode
 * @property {string} task
 * @property {string} specific_user_instruction
 * @property {string[][]} [output_assertions]
 * @property {Object<string, AriaATFile.StringNumber[][]>} [additional_assertions]
 */

/**
 * All the data collected into one file needed to run a test.
 * @typedef AriaATFile.CollectedTest
 * @property {object} info
 * @property {number} info.testId
 * @property {string} info.title
 * @property {string} info.task
 * @property {object[]} info.references
 * @property {string} info.references[].refId
 * @property {string} info.references[].value
 * @property {object} instructions
 * @property {string[]} instructions.user
 * @property {string} [instructions.mode]
 * @property {string} instructions.raw
 * @property {object} target
 * @property {object} target.at
 * @property {string} target.at.key
 * @property {string} target.at.raw
 * @property {string} target.at.name
 * @property {string} target.mode
 * @property {string} target.referencePage
 * @property {object} [target.setupScript]
 * @property {string} target.setupScript.name
 * @property {string} target.setupScript.description
 * @property {string} target.setupScript.source load with `new Function` if supported
 * @property {string} target.setupScript.modulePath load with `import(...)` if supported
 * @property {string} target.setupScript.jsonpPath load with `<script src="...">`
 * @property {object[]} commands
 * @property {string} commands[].id
 * @property {string} commands[].keystroke
 * @property {string} [commands[].extraInstruction]
 * @property {object[]} assertions[]
 * @property {1 | 2} assertions[].priority
 * @property {string} assertions[].expectation
 */

/**
 * @typedef AriaATFile.TestHTML
 * @property {AriaATFile.Behavior} testJson
 * @property {AriaATFile.CommandStore} commandsJson
 * @property {AriaATCSV.Reference[]} testReferences
 * @property {string} referencePage
 * @property {AriaATFile.ScriptSource[]} scripts
 */
