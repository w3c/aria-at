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

class Utils {
  constructor({ testFormatVersion, isVerbose = false, isValidate = false }) {
    this.testFormatVersion = testFormatVersion;
    this.logger = LOGGER(isVerbose, isValidate);
    this.log = this.logger.log;
  }

  set testPlanRecord(value) {
    this._testPlanRecord = value;
  }

  set testPlanDirectory(value) {
    this._testPlanDirectory = value;
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
      rawCSV = await readCSV(this._testPlanRecord.find(filePath));
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
 * @param {FileRecord.Record} record
 * @returns {Promise<string[][]>}
 */
function readCSV(record) {
  const rows = [];
  return new Promise(resolve => {
    Readable.from(record.buffer)
      .pipe(
        csv({
          mapHeaders: ({ header, index }) => {
            if (header.toLowerCase().includes('\ufeff'))
              console.error(
                `Unwanted U+FEFF found for key ${header} at index ${index} while processing CSV.`
              );
            return header.replace(/^\uFEFF/g, '');
          },
          mapValues: ({ header, value }) => {
            if (value.toLowerCase().includes('\ufeff'))
              console.error(
                `Unwanted U+FEFF found for value in key, value pair (${header}: ${value}) while processing CSV.`
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
  isScriptedReferenceRecord,
  loadScriptsSource,
  toBuffer,
};
