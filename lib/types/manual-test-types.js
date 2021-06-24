/**
 * @typedef TestJSON
 * @property {string} setup_script_description
 * @property {string} setupTestPage
 * @property {string[]} applies_to
 * @property {string} mode
 * @property {string} task
 * @property {string} specific_user_instruction
 * @property {string[][]} output_assertions
 */

/**
 * @typedef {Object.<string, Object.<string, string[][]>>} CommandsJSON
 */

/**
 * @typedef JSONFile<T>
 * @property {string} name
 * @property {T} json
 * @template T
 */

/** @typedef {JSONFile<CommandsJSON>} CommandsJSONFile */
/** @typedef {JSONFile<TestJSON>} TestJSONFile */
/** @typedef {JSONFile<SupportJSON>} SupportJSONFile */

/**
 * @typedef TestHTMLSource
 * @property {string} name
 * @property {string} title
 * @property {string} harnessPath
 * @property {string} supportPath
 * @property {string} keyPath
 * @property {string[]} metaLinks
 * @property {SetupScriptJSMap} scripts
 * @property {CommandsJSON} commands
 * @property {TestJSON} test
 */

/**
 * @typedef IndexHTMLSourceRow
 * @property {string} taskId
 * @property {string} testingTask
 * @property {Object.<string, boolean>} appliesTo
 * @property {string} setupScriptName
 */

/**
 * @typedef IndexHTMLSource
 * @property {IndexHTMLSourceRow[]} rows
 */

/**
 * All the information to turn into files output by the create test process.
 *
 * @typedef ManualSuite
 * @property {string} name
 * @property {CommandsJSONFiles} commandsJson
 * @property {TestJSONFile[]} testJsons
 * @property {SupportJSONFile} supportJson
 * @property {KeysModule} keysModule
 * @property {TestHTMLSource[]} testHtmlSources
 * @property {IndexHTMLSource} suiteIndexSource
 * @property {DiskAsset} referenceCopy
 * @property {DiskAsset} resourceCopy
 */
