/**
 * This module contains types describing values as they appear once freshly
 * parsed from their various input files.
 *
 * @module
 */

/**
 * A csv row from data/commands.json in its raw form.
 *
 * @typedef CommandCSVRow
 * @property {string} testId
 * @property {string} task
 * @property {string} mode
 * @property {string} at
 * @property {string} commandA
 * @property {string} commandB
 * @property {string} commandC
 * @property {string} commandD
 * @property {string} commandE
 * @property {string} commandF
 */

/**
 * All the task commands as rows in the csv.
 *
 * @typedef {CommandCSVRow[]} CommandCSV
 */

/**
 * @typedef ReferenceCSVRow
 * @property {string} refId
 * @property {string} value
 */

/**
 * @typedef {ReferenceCSVRow[]} ReferenceCSV
 */

/**
 * @typedef TestCSVRow
 * @property {string} testId
 * @property {string} title
 * @property {string} appliesTo comma separated list of assistive techs
 * @property {string} mode
 * @property {string} task
 * @property {string} setupScript
 * @property {string} setupScriptDescription
 * @property {string} refs space separated list of reference ids from references.csv
 * @property {string} instructions
 * @property {string} assertion1
 * @property {string} assertion2
 * @property {string} assertion3
 * @property {string} assertion4
 * @property {string} assertion5
 * @property {string} assertion6
 */

/**
 * @typedef {TestCSVRow[]} TestCSV
 */

/**
 * @typedef JSScript
 * @property {string} name
 * @property {string} raw
 */

/**
 * @typedef SuiteAsset
 * @property {"suite"} type
 * @property {string} name
 * @property {DiskAsset | null} entries
 * @property {DiskAsset | null} recources
 */

/**
 * @typedef {"Desktop Screen Readers" | "Screen Readers"} SupportJSONAppliesToKeys
 */

/**
 * @typedef SupportJSON
 * @property {object[]} ats
 * @property {string} ats[].name human readable name of assistive tech
 * @property {string} ats[].key aria-at identification key for assistive tech
 * @property {Object<string, string[]>} applies_to
 * @property {object[]} examples
 * @property {string} examples[].directory
 * @property {string} examples[].name
 */

/**
 * @typedef {Object<string, string>} KeysModule
 */

/**
 * @typedef SuiteParsed
 * @property {string} name
 * @property {JSScript[]} js
 * @property {CommandCSV} commands
 * @property {ReferenceCSV} references
 * @property {TestCSV} tests
 * @property {SupportJSON} support
 * @property {KeysModule} keys
 * @property {DiskAsset | null} referenceCopy
 * @property {DiskAsset | null} resourceCopy
 */
