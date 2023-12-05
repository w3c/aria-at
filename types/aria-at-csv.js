/**
 * Objects read from csv files without any further handling.
 * @namespace AriaATCSV
 */

/**
 * @typedef AriaATCSV.Command
 * @property {string} testId
 * @property {string} task
 * @property {string} mode
 * @property {string} at
 * @property {string} [commandA]
 * @property {string} [commandB]
 * @property {string} [commandC]
 * @property {string} [commandD]
 * @property {string} [commandE]
 * @property {string} [commandF]
 * @property {string} [commandG]
 * @property {string} [commandH]
 * @property {string} [commandI]
 * @property {string} [commandJ]
 * @property {string} [commandK]
 * @property {string} [commandL]
 * @property {string} [commandM]
 * @property {string} [commandN]
 * @property {string} [commandO]
 * @property {string} [commandP]
 * @property {string} [commandQ]
 * @property {string} [commandR]
 * @property {string} [commandS]
 * @property {string} [commandT]
 * @property {string} [commandU]
 * @property {string} [commandV]
 * @property {string} [commandW]
 * @property {string} [commandX]
 * @property {string} [commandY]
 * @property {string} [commandZ]
 */

/**
 * @typedef AriaATCSV.Reference
 * @property {string} refId
 * @property {string} type
 * @property {string} value
 * @property {string} linkText
 */

/**
 * @typedef AriaATCSV.SupportTestPlanStrings
 * @property {string} ariaSpecsPreface
 * @property {string} openExampleInstruction
 * @property {string} commandListPreface
 * @property {string} commandListSettingsPreface
 * @property {string} settingInstructionsPreface
 * @property {string} assertionResponseQuestion
 */

/**
 * @typedef AriaATCSV.SupportReference
 * @property {string} baseUrl
 * @property {string} linkText
 * @property {object} fragmentIds
 */

/**
 * @typedef AriaATCSV.SupportAtSetting
 * @property {string} screenText
 * @property {string[]} instructions
 */

/**
 * @typedef AriaATCSV.SupportAt
 * @property {string} key
 * @property {string} name
 * @property {string} defaultConfigurationInstructionsHTML
 * @property {Object} assertionTokens
 * @property {string} assertionTokens.screenReader
 * @property {string} assertionTokens.readingMode
 * @property {string} assertionTokens.interactionMode
 * @property {Object<string, AriaATCSV.SupportAtSetting>} settings
 */

/**
 * @typedef AriaATCSV.Support
 * @property {AriaATCSV.SupportAt[]} ats
 * @property {Object<string, string[]>} applies_to
 * @property {AriaATCSV.SupportTestPlanStrings} testPlanStrings
 * @property {object} references
 * @property {AriaATCSV.SupportReference} references.aria
 * @property {AriaATCSV.SupportReference} references.htmlAam
 */

/**
 * @typedef AriaATCSV.AssertionCommandInfo
 * @property {string} testId
 * @property {string} command
 * @property {string} settings
 * @property {number} priority
 * @property {string} assertionExceptions
 */

/**
 * @typedef AriaATCSV.Assertion
 * @property {string} assertionId
 * @property {number} priority
 * @property {string} assertionStatement
 * @property {string} assertionPhrase
 * @property {string} refIds
 * @property {Object<string, AriaATCSV.AssertionCommandInfo>[]} commandInfo
 */

/**
 * @typedef AriaATCSV.Test
 * @property {string} testId
 * @property {string} title
 * @property {object} target
 * @property {object[]} target.ats
 * @property {number} presentationNumber
 * @property {string} appliesTo
 * @property {string} mode
 * @property {string} task
 * @property {string} setupScript
 * @property {string} setupScriptDescription
 * @property {string} refs
 * @property {string} instructions
 * @property {AriaATCSV.Assertion[]} assertions
 * @property {Object<string, AriaATCSV.AssertionCommandInfo[]>} commandsInfo
 * @property {string} [assertion1]
 * @property {string} [assertion2]
 * @property {string} [assertion3]
 * @property {string} [assertion4]
 * @property {string} [assertion5]
 * @property {string} [assertion6]
 * @property {string} [assertion7]
 * @property {string} [assertion8]
 * @property {string} [assertion9]
 * @property {string} [assertion10]
 * @property {string} [assertion11]
 * @property {string} [assertion12]
 * @property {string} [assertion13]
 * @property {string} [assertion14]
 * @property {string} [assertion15]
 * @property {string} [assertion16]
 * @property {string} [assertion17]
 * @property {string} [assertion18]
 * @property {string} [assertion19]
 * @property {string} [assertion20]
 * @property {string} [assertion21]
 * @property {string} [assertion22]
 * @property {string} [assertion23]
 * @property {string} [assertion24]
 * @property {string} [assertion25]
 * @property {string} [assertion26]
 * @property {string} [assertion27]
 * @property {string} [assertion28]
 * @property {string} [assertion29]
 * @property {string} [assertion30]
 */
