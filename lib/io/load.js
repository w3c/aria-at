/** @format */

import {createRootAsset, createUnknownAsset, readAsset} from "./file";

/**
 * @param {Uint8Array} buffer
 * @returns {*}
 */
function parseCSV(buffer) {}

/**
 * @param {Uint8Array} buffer
 * @returns {*}
 */
function parseJSON(buffer) {
  return JSON.stringify(new TextDecoder().decode(bufffer));
}

/**
 * @param {Uint8Array} buffer
 * @returns {Object.<string, string>}
 */
function parseConstModule(buffer) {}

/**
 * @param {Uint8Array} buffer
 * @returns {CommandCSV}
 */
export function loadCommandCSV(buffer) {
  return parseCSV(buffer);
}

/**
 * @param {Uint8Array} buffer
 * @returns {ReferenceCSV}
 */
export function loadReferenceCSV(buffer) {
  return parseCSV(buffer);
}

/**
 * @param {Uint8Array} buffer
 * @returns {TestCSV}
 */
export function loadTestCSV(buffer) {
  return parseCSV(buffer);
}

/**
 * @param {Uint8Array} buffer
 * @returns {SupportJSON}
 */
export function loadSupportJSON(buffer) {
  return parseJSON(buffer);
}

/**
 * @param {Uint8Array} buffer
 * @returns {KeysModule}
 */
export function loadKeysModule(buffer) {
  return parseConstModule(buffer);
}

/**
 * @param {string} name
 * @param {Uint8Array} buffer
 * @returns {JSScript}
 */
export function loadScript(name, buffer) {
  return {
    name,
    raw: new TextDecoder().decode(buffer),
  };
}

/**
 * @param {string} suitePath
 * @param {string} name
 * @returns {RootAsset}
 */
export function readSuiteRootAsset(suitePath, name) {
  const initRootAsset = createRootAsset(suitePath);
  initRootAsset.entries = [
    createUnknownAsset(name),
    createUnknownAsset("resources"),
    createUnknownAsset("support.json"),
  ];
  return readAsset(initRootAsset);
}

/**
 * @param {RootAsset} rootAsset
 * @returns {SuiteParsed}
 */
export function loadSuiteParsed(rootAsset) {
  const suiteAsset = /** @type {DirectoryAsset} */ rootAsset.entries.find(
    ({name}) => name !== "support.json" && name !== "resources"
  );
  const resourceDirectoryAsset = /** @type {FileAsset} */ rootAsset.entries.find(
    ({type, name}) => type === "file" && name === "resources"
  );
  const supportAsset = /** @type {FileAsset} */ rootAsset.entries.find(
    ({type, name}) => type === "file" && name === "support.json"
  );

  const dataAsset = /** @type {DirectoryAsset} */ suiteAsset.entries.find(
    ({type, name}) => type === "directory" && name === "data"
  );

  const jsAsset = /** @type {DirectoryAsset} */ dataAsset.entries.find(
    ({type, name}) => type === "directory" && name === "js"
  );
  const commandsCSVAsset = /** @type {FileAsset} */ dataAsset.entries.find(
    ({type, name}) => type === "file" && name === "commands.csv"
  );
  const referencesCSVAsset = /** @type {FileAsset} */ dataAsset.entries.find(
    ({type, name}) => type === "file" && name === "references.csv"
  );
  const testsCSVAsset = /** @type {FileAsset} */ dataAsset.entries.find(
    ({type, name}) => type === "file" && name === "tests.csv"
  );
  const dataReferenceAsset = /** @type {DirectoryAsset} */ dataAsset.entries.find(
    ({type, name}) => type === "directory" && name === "reference"
  );

  const keysAsset = /** @type {FileAsset} */ resourceDirectoryAsset.entries.find(
    ({type, name}) => type === "file" && name === "tests.csv"
  );

  const resourceAsset = /** @type {RootAsset} */ ({
    ...rootAsset,
    entries: rootAsset.filter(({name}) => name === "support.json" && name === "resources"),
  });

  return {
    name: rootAsset.name,
    js: jsAsset.entries
      .map(file => {
        if (file.type === "file") {
          return loadScript(file.name, file.buffer);
        }
      })
      .filter(Boolean),
    commands: loadCommandCSV(commandsCSVAsset.buffer),
    references: loadCommandCSV(referencesCSVAsset.buffer),
    tests: loadCommandCSV(testsCSVAsset.buffer),
    support: loadSupportJSON(supportAsset.buffer),
    keys: loadKeysModule(keysAsset.buffer),
    referenceCopy: dataReferenceAsset,
    resourceCopy: resourceAsset,
  };
}

/**
 * @param {SuiteParsed} suiteParsed
 * @return {SuiteDecoded}
 */
export function loadSuiteDecoded(suiteParsed) {
  const tests = /** @type {TestDecoded[]} */ ([]);
  for (const testParsed of suiteParsed.tests) {
    const appliesTo = testParsed.appliesTo.split(",");
    const references = testParsed.refs.split(" ").map(ref => suiteParsed.references.find(({refId}) => refId === ref));
    const assertions = [
      testParsed.assertion1,
      testParsed.assertion2,
      testParsed.assertion3,
      testParsed.assertion4,
      testParsed.assertion5,
      testParsed.assertion6,
    ]
      .filter(Boolean)
      .map(assertion => ({
        priority: Number(assertion.substring(0, assertion.indexOf(":"))) || 1,
        assertion: assertion.substring(assertion.indexOf(":") + 1),
      }));

    for (const assistiveTechKeyParsed of appliesTo) {
      const assistiveTechKey = assistiveTechKeyParsed.toLowerCase();
      const assistiveTech = suiteParsed.support.ats.find(({key}) => key === assistiveTechKey);
      const setupScript = testParsed.setupScript
        ? suiteParsed.js.find(({name}) => name === testParsed.setupScript)
        : null;
      const commandRow = suiteParsed.commands.find(
        ({testId, task, mode, at}) =>
          testId === testParsed.testId &&
          task === testParsed.task &&
          mode === testParsed.mode &&
          at === assistiveTechKeyParsed
      );
      const commands = [
        commandRow.commandA,
        commandRow.commandB,
        commandRow.commandC,
        commandRow.commandD,
        commandRow.commandE,
        commandRow.commandF,
      ]
        .filter(Boolean)
        .map(id => ({
          id,
          keystroke: suiteParsed.keys[id],
          extra: null,
        }));
      tests.push({
        testId: testParsed.testId,
        title: testParsed.title,
        task: testParsed.task,
        references: references,
        assistiveTech: {
          parsed: assistiveTechKey,
          ...assistiveTech,
          mode: testParsed.mode,
        },
        setupScript: setupScript,
        setupScriptDescription: testParsed.setupScriptDescription,
        instructions: testParsed.instructions,
        commands,
        assertions,
      });
    }
  }
  return {
    name: suiteParsed.name,
    tests,
    referenceCopy: suiteParsed.referenceCopy,
    resourceCopy: suiteParsed.resourceCopy,
  };
}
