/// <reference path="./aria-at-csv.js" />

/**
 * Objects parsed from raw csv objects in AriaAtTCSV, json files, or js modules.
 * @namespace AriaATParsed
 */

/**
 * Object parsed from AriaATCSV.Command without depending on other information
 * and not yet validated.
 * @typedef AriaATParsed.Command
 * @property {number} testId
 * @property {string} task
 * @property {object} target
 * @property {object} target.at
 * @property {string} target.at.key
 * @property {string} target.at.raw
 * @property {string} target.mode
 * @property {object[]} commands
 * @property {string} commands[].id
 * @property {object[]} commands[].keypresses
 * @property {string} commands[].keypresses[].id
 * @property {string} [commands[].extraInstruction]
 */

/**
 * @typedef AriaATParsed.Key
 * @property {string} id
 * @property {string} keystroke
 */

/**
 * @typedef {Object<string, AriaATParsed.Key>} AriaATParsed.KeyMap
 */

/**
 * @typedef {Object<string, AriaATCSV.Reference>} AriaATParsed.ReferenceMap
 */

/**
 * @typedef AriaATParsed.ScriptSource
 * @property {string} name
 * @property {string} source
 * @property {string} modulePath
 * @property {string} jsonpPath
 */

/**
 * @typedef AriaATParsed.Support
 * @property {AriaATCSV.SupportAt[]} ats
 * @property {object[]} atGroups
 * @property {string} atGroups[].key
 * @property {string} atGroups[].name
 * @property {object[]} atGroups[].ats
 * @property {string} atGroups[].ats[].key
 * @property {string} atGroups[].ats[].name
 * @property {AriaATCSV.SupportTestPlanStrings} testPlanStrings
 * @property {object} references
 * @property {AriaATCSV.SupportReference} references.aria
 * @property {AriaATCSV.SupportReference} references.htmlAam
 */

/**
 * Object parsed from AriaATCSV.Test without depending on other information and
 * not yet validated.
 * @typedef AriaATParsed.Test
 * @property {number} testId
 * @property {string} title
 * @property {string} task
 * @property {object} target
 * @property {object[]} target.at
 * @property {string} target.at[].key
 * @property {string} target.at[].raw
 * @property {string} target.mode
 * @property {object} [setupScript]
 * @property {string} setupScript.name
 * @property {string} setupScript.description
 * @property {object[]} references
 * @property {string} references[].refId
 * @property {object} instructions
 * @property {string[]} instructions.user
 * @property {string} instructions.raw
 * @property {object[]} assertions
 * @property {number | string} assertions[].priority
 * @property {string} assertions[].expectation
 */
