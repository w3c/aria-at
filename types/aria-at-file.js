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
 * @property {object} appliesTo
 * @property {string[]} appliesTo.system
 * @property {object[]} examples
 * @property {string} examples[].directory
 * @property {string} examples[].name
 */

/**
 * 1 or 2 member tuples of strings.
 * @typedef {string[]} AriaATFile.CommandExtraInstructionTuple
 */

/**
 * @typedef {Object<string, AriaATFile.CommandExtraInstructionTuple[]>} AriaATFile.CommandTuplesATLookup
 */

/**
 * @typedef {Object<string, AriaATFile.CommandTuplesATLookup>} AriaATFile.CommandTuplesATModeLookup
 */

/**
 * An object with keys that have sentence-long descriptions of their value.
 * @typedef {Object<string, AriaATFile.CommandTuplesATModeLookup>} AriaATFile.CommandTuplesATModeTaskLookup
 */

/**
 * @typedef {number | string} AriaATFile.StringNumber
 */

/** @typedef {"reading" | "interaction"} AriaATFile.ATMode */

/**
 * @typedef AriaATFile.Behavior
 * @property {string} setupScriptDescription
 * @property {string} setupTestPage
 * @property {string} assertionResponseQuestion
 * @property {string[]} appliesTo
 * @property {AriaATFile.ATMode | AriaATFile.ATMode[]} mode
 * @property {string} task
 * @property {string} specificUserInstruction
 * @property {string[][]} [outputAssertions]
 * @property {Object<string, AriaATCSV.AssertionCommandInfo[]>} commandsInfo
 */

/**
 * All the data collected into one file needed to run a test.
 * @typedef AriaATFile.CollectedTest
 * @property {object} info
 * @property {number} info.testId
 * @property {string} info.title
 * @property {string} info.task
 * @property {number} info.presentationNumber
 * @property {object[]} info.references
 * @property {string} info.references[].refId
 * @property {string} info.references[].value
 * @property {object} instructions
 * @property {string[] | string} instructions.instructions
 * @property {string[] | string} instructions.user
 * @property {string[] | string} instructions.mode
 * @property {string[] | string} instructions.raw
 * @property {object} target
 * @property {object} target.at
 * @property {string} target.at.key
 * @property {string | object} target.at.raw
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
 * @property {string} commands[].keystroke human-readable sequence of key and key chord presses
 * @property {object[]} commands[].keypresses
 * @property {string} commands[].keypresses[].id
 * @property {string} commands[].keypresses[].keystroke single human-readable key or key chord press
 * @property {string} [commands[].extraInstruction] human-readable additional instruction to follow
 * @property {string} [commands[].settings] this property only exists on v2 tests
 * @property {object[]} assertions[]
 * @property {1 | 2} assertions[].priority
 * @property {string} [assertions[].expectation] assertion statement string, this property only exists on v1 tests
 * @property {string} [assertions[].assertionStatement] assertion statement string, this property only exists on v2 tests
 */

/**
 * @typedef AriaATFile.TestHTML
 * @property {AriaATFile.Behavior} testJson
 * @property {AriaATFile.CommandStore} commandsJson
 * @property {AriaATCSV.Reference[]} testReferences
 * @property {string} referencePage
 * @property {AriaATFile.ScriptSource[]} scripts
 */
