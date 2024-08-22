const path = require('path');
const { Readable } = require('stream');
const {
  types: { isArrayBufferView, isArrayBuffer },
} = require('util');
const beautify = require('json-beautify');
const csv = require('csv-parser');
const { reindent } = require('../../util/lines');
const { Queryable } = require('../../util/queryable');
const { renderHTML: renderCollectedTestHtml } = require('../templates/collected-test.html');
const { FileRecordChain } = require('../../util/file-record-chain');
const { flattenObject } = require('../parse-command-csv-row');

/**
 * Utils handler class for shared functions used during the process-test-directory script.
 * Several functions' results are based mainly on the testFormatVersion being used
 */
class Utils {
  constructor({ testFormatVersion, isVerbose = false, isValidate = false }) {
    this.testFormatVersion = testFormatVersion;
    this.logger = LOGGER(isVerbose, isValidate);
    this.log = this.logger.log;

    this.errorCount = 0;
    this.errors = '';
  }

  set testPlanName(value) {
    this._testPlanName = value;
  }

  set testPlanDirectory(value) {
    this._testPlanDirectory = value;
  }

  set commandsJsonRecord(value) {
    this._commandsJsonRecord = value;
    this.commandsJson = JSON.parse(value.text);
  }

  set testPlanRecord(value) {
    this._testPlanRecord = value;
  }

  set resourcesRecord(value) {
    this._resourcesRecord = value;
  }

  set scriptsRecord(value) {
    this._scriptsRecord = value;
  }

  set supportJsonRecord(value) {
    this._supportJsonRecord = value;
    this.supportJson = JSON.parse(value.text);
  }

  // Error handler functions
  /**
   * @param {string} id
   * @param {string} error
   */
  addTestError(id, error) {
    this.errorCount += 1;
    this.errors += '[Test ' + id + ']: ' + error + '\n';
  }

  /**
   * @param {object} options
   * @param {string} options.testId
   * @param {object} options.target
   * @param {string} key
   */
  addCommandError(
    {
      testId,
      task,
      target: {
        at: { key: atKey },
      },
    },
    key
  ) {
    this.errorCount += 1;

    if (this.testFormatVersion === 1) {
      this.errors += `[Command]: The key reference "${key}" found in "tests/${this._testPlanName}/data/commands.csv" for "test id ${testId}: ${task}" is invalid. Command may not be defined in "tests/resources/keys.mjs".\n`;
    } else {
      this.errors += `[Command]: The key reference "${key}" found in "tests/${this._testPlanName}/data/${atKey}-commands.csv" for "test id ${testId}" is invalid. Command may not be defined in "tests/commands.json".\n`;
    }
  }

  /**
   * @param {object} options
   * @param {string} options.testId
   * @param {object} options.target
   * @param {string} assertion
   */
  addCommandAssertionExceptionError(
    {
      testId,
      target: {
        at: { key: atKey },
      },
    },
    assertion
  ) {
    this.errorCount += 1;
    this.errors += `[Command]: assertionExceptions reference "${assertion}" found in "tests/${this._testPlanName}/data/${atKey}-commands.csv" for "test id ${testId}" is invalid.\n`;
  }

  /**
   * @param {string} reason
   */
  addKeyMapError(reason) {
    this.errorCount += 1;
    this.errors += `[commands.json]: ${reason}\n`;
  }

  // createTestFile functions
  addSetupScript(testId, scriptName) {
    const scriptsContent = [];

    let script = '';
    if (scriptName) {
      if (!this._scriptsRecord.find(`${scriptName}.js`).isFile()) {
        this.addTestError(testId, `Setup script does not exist: ${scriptName}.js`);
        return '';
      }

      try {
        const data = this._scriptsRecord.find(`${scriptName}.js`).text;
        const lines = data.split(/\r?\n/);
        lines.forEach(line => {
          if (line.trim().length) script += '\t\t\t' + line.trim() + '\n';
        });
      } catch (err) {
        this.log.warning(err);
      }

      scriptsContent.push(`\t\t${scriptName}: function(testPageDocument){\n${script}\t\t}`);
    }

    return scriptsContent;
  }

  getSetupScriptDescription(desc) {
    let str = '';
    if (typeof desc === 'string') {
      let d = desc.trim();
      if (d.length) {
        str = d;
      }
    }

    return str;
  }

  /**
   * @param {AriaATFile.CollectedTest} test
   * @param {string} testPlanBuildDirectory
   * @param {string | null} fileName
   * @returns {{path: string, content: Uint8Array}}
   */
  createCollectedTestFile(test, testPlanBuildDirectory, fileName = null) {
    if (this.testFormatVersion === 1) {
      return {
        path: path.join(
          testPlanBuildDirectory,
          `test-${test.info.testId.toString().padStart(2, '0')}-${test.info.task.replace(
            /\s+/g,
            '-'
          )}-${test.target.mode}-${test.target.at.key}.collected.json`
        ),
        content: encodeText(beautify(test, null, 2, 40)),
      };
    } else {
      const testPresentationNumber = parseInt(test.info.presentationNumber)
        .toString()
        .padStart(2, '0');
      const testFileName =
        fileName ||
        `test-${testPresentationNumber}-${test.info.testId}-${test.target.at.key}-${test.target.at.settings}`;

      return {
        path: path.join(testPlanBuildDirectory, `${testFileName}.collected.json`),
        content: encodeText(beautify(test, null, 2, 40)),
      };
    }
  }

  /**
   * @param {AriaATFile.CollectedTest} test
   * @param {string} testPlanBuildDirectory
   * @param {string | null} fileName
   * @returns {{path: string, content: Uint8Array}}
   */
  createCollectedTestHtmlFile(test, testPlanBuildDirectory, fileName = null) {
    if (this.testFormatVersion === 1) {
      const testJsonFileName = `test-${test.info.testId
        .toString()
        .padStart(2, '0')}-${test.info.task.replace(/\s+/g, '-')}-${test.target.mode}-${
        test.target.at.key
      }.collected.json`;
      return {
        path: path.join(
          testPlanBuildDirectory,
          `test-${test.info.testId.toString().padStart(2, '0')}-${test.info.task.replace(
            /\s+/g,
            '-'
          )}-${test.target.mode}-${test.target.at.key}.collected.html`
        ),
        content: encodeText(renderCollectedTestHtml(test, testJsonFileName)),
      };
    } else {
      const testPresentationNumber = parseInt(test.info.presentationNumber)
        .toString()
        .padStart(2, '0');
      const testFileName =
        fileName ||
        `test-${testPresentationNumber}-${test.info.testId}-${test.target.at.key}-${test.target.at.settings}`;

      return {
        path: path.join(testPlanBuildDirectory, `${testFileName}.collected.html`),
        content: encodeText(renderCollectedTestHtml(test, `${testFileName}.collected.json`)),
      };
    }
  }

  getKeyDefs() {
    let keyDefs = {};

    if (this.testFormatVersion === 1) {
      // Get Keys that are defined
      try {
        // read contents of the file
        const keys = this._resourcesRecord.find('keys.mjs').text;

        // split the contents by new line
        const lines = keys.split(/\r?\n/);

        // print all lines
        lines.forEach(line => {
          let parts1 = line.split(' ');
          let parts2 = line.split('"');

          if (parts1.length > 3) {
            let code = parts1[2].trim();
            keyDefs[code] = parts2[1].trim();
          }
        });
      } catch (err) {
        this.log.warning(err);
      }
    } else {
      keyDefs = flattenObject(this.commandsJson);
    }

    return keyDefs;
  }

  getRefs(referencesCsv) {
    const refs = {};

    if (this.testFormatVersion === 1) {
      for (const row of referencesCsv) {
        refs[row.refId] = row.value.trim();
      }
    } else {
      for (const row of referencesCsv) {
        const {
          references: { aria, htmlAam },
        } = this.supportJson;

        let refId = row.refId.trim();
        let type = row.type.trim();
        let value = row.value.trim();
        let linkText = row.linkText.trim();

        if (type === 'aria') {
          value = `${aria.baseUrl}${aria.fragmentIds[value]}`;
          linkText = `${linkText} ${aria.linkText}`;
        }

        if (type === 'htmlAam') {
          value = `${htmlAam.baseUrl}${htmlAam.fragmentIds[value]}`;
          linkText = `${linkText} ${htmlAam.linkText}`;
        }

        refs[refId] = {
          type,
          value,
          linkText,
        };
      }
    }
    return refs;
  }

  /**
   * @param {FileRecordChain} testPlanUpdate
   * @returns {FileRecordChain}
   */
  getNewBuild(testPlanUpdate) {
    const testsFolderEntries = [
      {
        name: this._testPlanName,
        entries: testPlanUpdate.filter({ glob: 'reference{,/**}' }).record.entries,
      },
      { name: 'resources', ...this._resourcesRecord.record },
      { name: 'support.json', ...this._supportJsonRecord.record },
    ];

    if (this.testFormatVersion === 2) {
      testsFolderEntries.push({ name: 'commands.json', ...this._commandsJsonRecord.record });
    }

    return new FileRecordChain({
      entries: [
        {
          name: 'tests',
          entries: testsFolderEntries,
        },
      ],
    });
  }

  getScriptsJs(scriptsContent = []) {
    let js = 'let scripts = {\n';
    js += scriptsContent.join(',\n');
    js += '\n\t};';
    return js;
  }

  /**
   * Filter out reference html files with inline scripts. Files that are not
   * regenerated will be removed from the filesystem.
   *
   * @returns {Promise<FileRecordChain>}
   */
  async getTestPlanUpdateRecord() {
    return this._testPlanRecord.walk(record => {
      if (record.entries) {
        return {
          ...record,
          entries: record.entries.filter(record => !isScriptedReferenceRecord(record)),
        };
      }
      return record;
    });
  }

  /**
   * @param {Object<string, string>} keyDefs
   * @returns {AriaATParsed.KeyMap}
   */
  parseKeyMap(keyDefs) {
    const keyMap = {};

    if (this.testFormatVersion === 1) {
      for (const id in keyDefs) {
        keyMap[id] = { id, keystroke: keyDefs[id] };
      }
    } else {
      for (const id in keyDefs) {
        if (id.includes('.')) {
          const [type, key] = id.split('.');
          keyMap[key] = { id: key, type, keystroke: keyDefs[id] };
        }
      }
    }

    return keyMap;
  }

  /**
   * @param {AriaATCSV.Reference[]} referenceRows
   * @param {AriaATCSV.SupportReference?} aria
   * @param {AriaATCSV.SupportReference?} htmlAam
   * @returns {AriaATParsed.ReferenceMap}
   */
  parseReferencesCSV(referenceRows, { aria, htmlAam } = {}) {
    const refMap = {};

    if (this.testFormatVersion === 1) {
      for (const { refId, value } of referenceRows) {
        refMap[refId] = { refId, value: value.trim() };
      }
    } else {
      for (const {
        refId: _refId,
        type: _type,
        value: _value,
        linkText: _linkText,
      } of referenceRows) {
        let refId = _refId?.trim();
        let type = _type?.trim();
        let value = _value?.trim();
        let linkText = _linkText?.trim();

        if (type === 'aria') {
          value = `${aria.baseUrl}${aria.fragmentIds[value]}`;
          linkText = `${linkText} ${aria.linkText}`;
        }

        if (type === 'htmlAam') {
          value = `${htmlAam.baseUrl}${htmlAam.fragmentIds[value]}`;
          linkText = `${linkText} ${htmlAam.linkText}`;
        }

        refMap[refId] = { refId, type, value, linkText };
      }
    }

    return refMap;
  }

  /**
   * Intended to be an internal helper to reduce some code duplication and make logging for csv
   * errors simpler
   *
   * @param filePath
   * @param rowValidator
   * @returns {Promise<string[][]|*[]> | null}
   */
  async readCSVFile(filePath, rowValidator = identity => identity) {
    let rawCSV = [];
    try {
      rawCSV = await readCSV(this._testPlanRecord.find(filePath), this._testPlanName);
    } catch (e) {
      this.log.warning(`WARNING: Error reading ${path.join(this._testPlanDirectory, filePath)}`);
      return rawCSV;
    }
    let index = 0;
    function printError(message) {
      // line number is index+2
      this.log.warning(
        `WARNING: Error parsing ${path.join(this._testPlanDirectory, filePath)} line ${
          index + 2
        }: ${message}`
      );
    }
    try {
      const firstRowKeysLength = Object.keys(rawCSV[0]).length;
      for (; index < rawCSV.length; index++) {
        const keysLength = Object.keys(rawCSV[index]).length;
        if (keysLength !== firstRowKeysLength) {
          printError(
            `column number mismatch, please include empty cells to match headers. Expected ${firstRowKeysLength} columns, found ${keysLength}`
          );
        }
        if (!rowValidator(rawCSV[index])) {
          printError('validator returned false result');
          return;
        }
      }
    } catch (err) {
      printError(err);
      return;
    }
    this.log(`Successfully parsed ${path.join(this._testPlanDirectory, filePath)}`);
    return rawCSV;
  }

  /**
   *
   * @param {FileRecordChain} record
   * @param {'directory' | 'file'} typeCheck
   * @param {string} path
   * @param {string} fileName
   * @param {string} shortenedFilePath
   * @param {string} customMessage
   */
  checkForMissingPath(
    record,
    typeCheck,
    { path, fileName, shortenedFilePath, customMessage } = {}
  ) {
    if (typeCheck === 'directory') {
      if (!record.isDirectory()) {
        const errorMessage =
          customMessage || `The directory '${path}' does not exist. Check the path.`;
        this.log.error(errorMessage);
      }
    } else if (typeCheck === 'file') {
      if (!record.find(shortenedFilePath).isFile()) {
        const errorMessage =
          customMessage || `The ${fileName} file does not exist. Please create '${path}' file.`;
        this.log.error(errorMessage);
      }
    }
  }

  /**
   * @param {AriaATParsed.KeyMap} keyMap
   * @param {object} options
   * @param {function(string): void} options.addKeyMapError
   */
  validateKeyMap(keyMap, { addKeyMapError }) {
    if (this.testFormatVersion === 1) {
      if (!keyMap.ALT_DELETE) addKeyMapError(`ALT_DELETE is not defined in keys module.`);
      if (!keyMap.INS_Z) addKeyMapError(`INS_Z is not defined in keys module.`);
      if (!keyMap.ESC) addKeyMapError(`ESC is not defined in keys module.`);
      if (!keyMap.INS_SPACE) addKeyMapError(`INS_SPACE is not defined in keys module.`);
      if (!keyMap.LEFT) addKeyMapError(`LEFT is not defined in keys module.`);
      if (!keyMap.RIGHT) addKeyMapError(`RIGHT is not defined in keys module.`);
    } else {
      if (!keyMap.alt) addKeyMapError('"alt" is not defined in keys module.');
      if (!keyMap.del) addKeyMapError('"del" is not defined in keys module.');
      if (!keyMap.ins) addKeyMapError('"ins" is not defined in keys module.');
      if (!keyMap.z) addKeyMapError('"z" is not defined in keys module.');
      if (!keyMap.esc) addKeyMapError('"esc" is not defined in keys module.');
      if (!keyMap.space) addKeyMapError('"space" is not defined in keys module.');
      if (!keyMap.left) addKeyMapError('"left" is not defined in keys module.');
      if (!keyMap.right) addKeyMapError('"right" is not defined in keys module.');
    }

    return keyMap;
  }

  MODE_INSTRUCTION_TEMPLATES_QUERYABLE(support) {
    if (this.testFormatVersion === 1) {
      return Queryable.from('modeInstructionTemplate', [
        {
          at: 'jaws',
          mode: 'reading',
          render: data => {
            const altDelete = data.key.where({ id: 'ALT_DELETE' });
            const esc = data.key.where({ id: 'ESC' });
            return `Verify the Virtual Cursor is active by pressing ${altDelete.keystroke}. If it is not, exit Forms Mode to activate the Virtual Cursor by pressing ${esc.keystroke}.`;
          },
        },
        {
          at: 'jaws',
          mode: 'interaction',
          render: data => {
            const altDelete = data.key.where({ id: 'ALT_DELETE' });
            const insZ = data.key.where({ id: 'INS_Z' });
            return `Verify the PC Cursor is active by pressing ${altDelete.keystroke}. If it is not, turn off the Virtual Cursor by pressing ${insZ.keystroke}.`;
          },
        },
        {
          at: 'nvda',
          mode: 'reading',
          render: data => {
            const esc = data.key.where({ id: 'ESC' });
            return `Ensure NVDA is in browse mode by pressing ${esc.keystroke}. Note: This command has no effect if NVDA is already in browse mode.`;
          },
        },
        {
          at: 'nvda',
          mode: 'interaction',
          render: data => {
            const insSpace = data.key.where({ id: 'INS_SPACE' });
            return `If NVDA did not make the focus mode sound when the test page loaded, press ${insSpace.keystroke} to turn focus mode on.`;
          },
        },
        {
          at: 'voiceover_macos',
          mode: 'reading',
          render: data => {
            const left = data.key.where({ id: 'LEFT' });
            const right = data.key.where({ id: 'RIGHT' });
            return `Toggle Quick Nav ON by pressing the ${left.keystroke} and ${right.keystroke} keys at the same time.`;
          },
        },
        {
          at: 'voiceover_macos',
          mode: 'interaction',
          render: data => {
            const left = data.key.where({ id: 'LEFT' });
            const right = data.key.where({ id: 'RIGHT' });
            return `Toggle Quick Nav OFF by pressing the ${left.keystroke} and ${right.keystroke} keys at the same time.`;
          },
        },
      ]);
    } else {
      const collection = [];
      support.ats.forEach(at => {
        const modes = Object.keys(at.settings);
        modes.forEach(mode => {
          collection.push({
            at: at.key,
            mode: mode,
            render: [at.defaultConfigurationInstructionsHTML, ...at.settings[mode].instructions],
          });
        });

        // Accounting for modeless AT configurations
        collection.push({
          at: at.key,
          mode: 'defaultMode',
          render: [at.defaultConfigurationInstructionsHTML],
        });
      });

      return Queryable.from('modeInstructionTemplate', collection);
    }
  }
}

function createExampleScriptedFile(name, examplePathTemplate, exampleTemplate, source) {
  return {
    name,
    path: examplePathTemplate(name),
    content: exampleTemplate.render(exampleTemplateParams(name, source)).toString(),
  };
}

/**
 * @param {AriaATFile.ScriptSource[]} scripts
 * @param {string} testPlanBuildDirectory
 * @returns {{path: string, content: Uint8Array}[]}
 */
function createScriptFiles(scripts, testPlanBuildDirectory) {
  const jsonpFunction = 'scriptsJsonpLoaded';

  return [
    ...scripts.reduce((files, script) => {
      const { modulePath, jsonpPath } = script;
      const oneScript = [script];

      return [...files, ...renderFileVariants(oneScript, modulePath, jsonpPath)];
    }, []),
    ...renderFileVariants(scripts, 'scripts.module.js', 'scripts.jsonp.js'),
  ];

  function renderFileVariants(scripts, modulePath, jsonpPath) {
    return [
      {
        path: path.join(testPlanBuildDirectory, modulePath),
        content: encodeText(renderModule(scripts).toString()),
      },
      {
        path: path.join(testPlanBuildDirectory, jsonpPath),
        content: encodeText(renderJsonp(scripts).toString()),
      },
    ];
  }

  function renderJsonp(scripts) {
    return reindent`window[document.currentScript.getAttribute("jsonpFunction") || "${jsonpFunction}"]({
  ${scripts.map(renderJsonpExport).join(',\n')}
});
`;
  }

  function renderJsonpExport({ name, source }) {
    return reindent`${name}(testPageDocument) {
  ${source.trim()}
}`;
  }

  function renderModule(scripts) {
    return reindent`${scripts.map(renderModuleExport).join('\n\n')}
`;
  }

  function renderModuleExport({ name, source }) {
    return reindent`export function ${name}(testPageDocument) {
  ${source.trim()}
}`;
  }
}

function encodeText(text) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(text);
  }
  return new Uint8Array(Buffer.from(text).arrayBuffer);
}

function exampleTemplateParams(name, source) {
  return {
    script: reindent`
<!-- Generated by process-test-directory.js -->
<script>
  (function() {
    function setupScript(testPageDocument) {
      // ${name}
      ${source}
    };
    document.addEventListener('click', function(event) {
      if (event.target.classList.contains('button-run-test-setup')) {
        event.target.disabled = true;
        setupScript(document);
      }
    });
  })();
</script>
<!-- End of generated output -->`,
    button: reindent`
<!-- Generated by process-test-directory.js -->
<div style="position: relative; left: 0; right: 0; height: 2rem;">
  <button class="button-run-test-setup" autofocus style="height: 100%; width: 100%;"${
    source ? '' : ' disabled'
  }>Run Test Setup</button>
</div>
<!-- End of generated output -->`,
  };
}

function getSetupScriptDescription(desc) {
  let str = '';
  if (typeof desc === 'string') {
    let d = desc.trim();
    if (d.length) {
      str = d;
    }
  }

  return str;
}

/**
 * @param {FileRecord.NamedRecord} subrecord
 * @returns {boolean}
 */
function isScriptedReferenceRecord(subrecord) {
  return (
    subrecord.name &&
    subrecord.name.endsWith('.html') &&
    subrecord.name.indexOf('.') !== subrecord.name.lastIndexOf('.')
  );
}

/**
 * @param {FileRecordChain} testPlanJS
 * @returns {AriaATParsed.ScriptSource[]}
 */
function loadScriptsSource(testPlanJS) {
  return testPlanJS.filter({ glob: ',*.js' }).entries.map(({ name: fileName, text: source }) => {
    const name = path.basename(fileName, '.js');
    const modulePath = path.posix.join('scripts', `${name}.module.js`);
    const jsonpPath = path.posix.join('scripts', `${name}.jsonp.js`);

    /** @type {AriaATFile.ScriptSource} */
    return {
      name,
      source,
      modulePath,
      jsonpPath,
    };
  });
}

/**
 * @param {T} maybeDefined
 * @param {function(T): U} goal
 * @returns {T}
 * @template T
 * @template {T} U
 */
function mapDefined(maybeDefined, goal) {
  if (maybeDefined) {
    return goal(maybeDefined);
  }
  return maybeDefined;
}

/**
 * @param {FileRecord.Record} record
 * @param {string} testPlanName
 * @returns {Promise<string[][]>}
 */
function readCSV(record, testPlanName) {
  const rows = [];
  return new Promise(resolve => {
    Readable.from(record.buffer)
      .pipe(
        csv({
          mapHeaders: ({ header, index }) => {
            if (header.toLowerCase().includes('\ufeff'))
              console.error(
                `[tests/${testPlanName}]: Unwanted U+FEFF found for key ${header} at index ${index} while processing ${record.name}.`
              );
            return header.replace(/^\uFEFF/g, '');
          },
          mapValues: ({ header, value }) => {
            if (value.toLowerCase().includes('\ufeff'))
              console.error(
                `[tests/${testPlanName}]: Unwanted U+FEFF found for value in key, value pair (${header}: ${value}) while processing ${record.name}.`
              );
            return value.replace(/^\uFEFF/g, '');
          },
        })
      )
      .on('data', row => {
        rows.push(row);
      })
      .on('end', () => {
        resolve(rows);
      });
  });
}

function toBuffer(content) {
  if (Buffer.isBuffer(content) || isArrayBufferView(content) || isArrayBuffer(content)) {
    return content;
  } else if (typeof content === 'string') {
    return Buffer.from(content);
  }
  return Buffer.from(content.toString());
}

const LOGGER = (isVerbose, isValidate) => {
  const VERBOSE_CHECK = isVerbose;
  const VALIDATE_CHECK = isValidate;

  let suppressedMessages = 0;

  /**
   * @param {string} message - message to be logged
   * @param {object} [options]
   * @param {boolean} [options.severe=false] - indicates whether the message should be viewed as an error or not
   * @param {boolean} [options.force=false] - indicates whether this message should be forced to be outputted regardless of verbosity level
   */
  const log = (message, { severe = false, force = false } = {}) => {
    if (VERBOSE_CHECK || force) {
      if (severe) console.error(message);
      else console.log(message);
    } else {
      // Output no logs
      suppressedMessages += 1; // counter to indicate how many messages were hidden
    }
  };

  /**
   * @param {string} message - error message
   */
  log.warning = message => log(message, { severe: true, force: true });

  /**
   * Log error then exit the process.
   * @param {string} message - error message
   */
  log.error = message => {
    log.warning(message);
    process.exit(1);
  };

  log.suppressedMessages = () => suppressedMessages;

  return { log, VALIDATE_CHECK };
};

module.exports = {
  Utils,
  createExampleScriptedFile,
  createScriptFiles,
  getSetupScriptDescription,
  loadScriptsSource,
  mapDefined,
  toBuffer,
};
