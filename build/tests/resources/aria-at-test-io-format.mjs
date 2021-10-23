/// <reference path="../../types/aria-at-file.js" />
/// <reference path="./types/aria-at-test-run.js" />
/// <reference path="./types/aria-at-test-result.js" />

import {
  HasUnexpectedBehaviorMap,
  createEnumMap,
  TestRun,
  AssertionResultMap,
  UserActionMap,
  CommonResultMap,
} from "./aria-at-test-run.mjs";
import * as keysModule from "./keys.mjs";

const UNEXPECTED_BEHAVIORS = [
  "Output is excessively verbose, e.g., includes redundant and/or irrelevant speech",
  "Reading cursor position changed in an unexpected manner",
  "Screen reader became extremely sluggish",
  "Screen reader crashed",
  "Browser crashed",
];

/** Depends on ConfigInput. */
class KeysInput {
  /**
   * @param {object} value
   * @param {string} value.origin
   * @param {{[KEY_ID: string]: string}} value.keys
   * @param {ATJSON} value.at
   * @param {{[atMode in ATMode]: string}} value.modeInstructions
   * @private
   */
  constructor(value) {
    this.errors = [];

    /** @private */
    this._value = value;
  }

  origin() {
    return this._value.origin;
  }

  /**
   * @param {string} keyId
   * @returns {string}
   */
  keysForCommand(keyId) {
    return this._value.keys[keyId];
  }

  /**
   * @param {ATMode} atMode
   */
  modeInstructions(atMode) {
    if (this._value.modeInstructions[atMode]) {
      return this._value.modeInstructions[atMode];
    }
    return "";
  }

  /**
   * @param {object} data
   * @param {ConfigInput} data.configInput
   */
  static fromBuiltinAndConfig({configInput}) {
    const keys = keysModule;
    const atKey = configInput.at().key;

    invariant(
      ["jaws", "nvda", "voiceover_macos"].includes(atKey),
      '%s is one of "jaws", "nvda", or "voiceover_macos"',
      atKey
    );

    return new KeysInput({
      origin: "resources/keys.mjs",
      keys,
      at: atKey,
      modeInstructions: {
        reading: {
          jaws: `Verify the Virtual Cursor is active by pressing ${keys.ALT_DELETE}. If it is not, turn on the Virtual Cursor by pressing ${keys.INS_Z}.`,
          nvda: `Insure NVDA is in browse mode by pressing ${keys.ESC}. Note: This command has no effect if NVDA is already in browse mode.`,
          voiceover_macos: `Toggle Quick Nav ON by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`,
        }[atKey],
        interaction: {
          jaws: `Verify the PC Cursor is active by pressing ${keys.ALT_DELETE}. If it is not, turn off the Virtual Cursor by pressing ${keys.INS_Z}.`,
          nvda: `If NVDA did not make the focus mode sound when the test page loaded, press ${keys.INS_SPACE} to turn focus mode on.`,
          voiceover_macos: `Toggle Quick Nav OFF by pressing the ${keys.LEFT} and ${keys.RIGHT} keys at the same time.`,
        }[atKey],
      },
    });
  }

  /** @param {AriaATFile.CollectedTest} collectedTest */
  static fromCollectedTest(collectedTest) {
    return new KeysInput({
      origin: "test.collected.json",
      keys: collectedTest.commands.reduce((carry, {id, keystroke}) => {
        carry[id] = keystroke;
        return carry;
      }, {}),
      at: collectedTest.target.at.key,
      modeInstructions: collectedTest.instructions.mode,
    });
  }
}

class SupportInput {
  /**
   * @param {SupportJSON} value
   * @private
   */
  constructor(value) {
    this.errors = [];

    /** @private */
    this._value = value;
  }

  defaultAT() {
    return this._value.ats[0];
  }

  /**
   * @param {string} atKey
   * @returns {ATJSON | undefined}
   */
  findAT(atKey) {
    const lowercaseATKey = atKey.toLowerCase();
    return this._value.ats.find(({key}) => key === lowercaseATKey);
  }

  /**
   * @param {SupportJSON} json
   */
  static fromJSON(json) {
    return new SupportInput(json);
  }

  /**
   * @param {AriaATFile.CollectedTest} collectedTest
   */
  static fromCollectedTest(collectedTest) {
    return new SupportInput({
      ats: [{key: collectedTest.target.at.key, name: collectedTest.target.at.name}],
      applies_to: {},
      examples: [],
    });
  }
}

/** Depends on ConfigInput and KeysInput. */
class CommandsInput {
  /**
   * @param {object} value
   * @param {CommandsJSON} value.commands
   * @param {ATJSON} value.at
   * @param {KeysInput} keysInput
   * @private
   */
  constructor(value, keysInput) {
    this.errors = [];

    /** @private */
    this._value = value;

    /** @private */
    this._keysInput = keysInput;
  }

  /**
   * @param {string} task
   * @param {ATMode} atMode
   * @returns {string[]}
   */
  getCommands(task, atMode) {
    const assistiveTech = this._value.at;

    if (!this._value.commands[task]) {
      throw new Error(`Task "${task}" does not exist, please add to at-commands or correct your spelling.`);
    } else if (!this._value.commands[task][atMode]) {
      throw new Error(
        `Mode "${atMode}" instructions for task "${task}" does not exist, please add to at-commands or correct your spelling.`
      );
    }

    let commandsData = this._value.commands[task][atMode][assistiveTech.key] || [];
    let commands = [];

    for (let c of commandsData) {
      let innerCommands = [];
      let commandSequence = c[0].split(",");
      for (let command of commandSequence) {
        command = this._keysInput.keysForCommand(command);
        if (typeof command === "undefined") {
          throw new Error(
            `Key instruction identifier "${c}" for AT "${assistiveTech.name}", mode "${atMode}", task "${task}" is not an available identified. Update you commands.json file to the correct identifier or add your identifier to resources/keys.mjs.`
          );
        }

        let furtherInstruction = c[1];
        command = furtherInstruction ? `${command} ${furtherInstruction}` : command;
        innerCommands.push(command);
      }
      commands.push(innerCommands.join(", then "));
    }

    return commands;
  }

  /**
   * @param {CommandsJSON} json
   * @param {object} data
   * @param {ConfigInput} data.configInput
   * @param {KeysInput} data.keysInput
   */
  static fromJSONAndConfigKeys(json, {configInput, keysInput}) {
    return new CommandsInput({commands: json, at: configInput.at()}, keysInput);
  }

  /**
   * @param {AriaATFile.CollectedTest} collectedTest
   * @param {object} data
   * @param {KeysInput} data.keysInput
   */
  static fromCollectedTestKeys(collectedTest, {keysInput}) {
    return new CommandsInput(
      {
        commands: {
          [collectedTest.info.task]: {
            [collectedTest.target.mode]: {
              [collectedTest.target.at.key]: collectedTest.commands.map(({id, extraInstruction}) =>
                extraInstruction ? [id, extraInstruction] : [id]
              ),
            },
          },
        },
        at: collectedTest.target.at,
      },
      keysInput
    );
  }
}

/**
 * Depends on SupportInput.
 */
class ConfigInput {
  /**
   * @param {string[]} errors
   * @param {object} value
   * @param {ATJSON} value.at
   * @param {boolean} value.displaySubmitButton
   * @param {boolean} value.renderResultsAfterSubmit
   * @param {"SubmitResultsJSON" | "TestResultJSON"} value.resultFormat
   * @param {AriaATTestResult.JSON | null} value.resultJSON
   * @private
   */
  constructor(errors, value) {
    this.errors = errors;

    /** @private */
    this._value = value;
  }

  at() {
    return this._value.at;
  }

  displaySubmitButton() {
    return this._value.displaySubmitButton;
  }

  renderResultsAfterSubmit() {
    return this._value.renderResultsAfterSubmit;
  }

  resultFormat() {
    return this._value.resultFormat;
  }

  resultJSON() {
    return this._value.resultJSON;
  }

  /**
   * @param {ConfigQueryParams} queryParams
   * @param {object} data
   * @param {SupportInput} data.supportInput
   */
  static fromQueryParamsAndSupport(queryParams, {supportInput}) {
    const errors = [];

    let at = supportInput.defaultAT();
    let displaySubmitButton = true;
    let renderResultsAfterSubmit = true;
    let resultFormat = "SubmitResultsJSON";
    let resultJSON = null;

    for (const [key, value] of queryParams) {
      if (key === "at") {
        const requestedAT = value;
        const knownAt = supportInput.findAT(requestedAT);
        if (knownAt) {
          at = knownAt;
        } else {
          errors.push(
            `Harness does not have commands for the requested assistive technology ('${requestedAT}'), showing commands for assistive technology '${at.name}' instead. To test '${requestedAT}', please contribute command mappings to this project.`
          );
        }
      } else if (key === "showResults") {
        displaySubmitButton = decodeBooleanParam(value, displaySubmitButton);
      } else if (key === "showSubmitButton") {
        renderResultsAfterSubmit = decodeBooleanParam(value, renderResultsAfterSubmit);
      } else if (key === "resultFormat") {
        if (value !== "SubmitResultsJSON" && value !== "TestResultJSON") {
          errors.push(`resultFormat can be 'SubmitResultsJSON' or 'TestResultJSON'. '${value}' is not supported.`);
          continue;
        }
        resultFormat = value;
      } else if (key === "resultJSON") {
        try {
          resultJSON = JSON.parse(value);
        } catch (error) {
          errors.push(`Failed to parse resultJSON: ${error.message}`);
        }
      }
    }

    if (resultJSON && resultFormat !== "TestResultJSON") {
      errors.push(`resultJSON requires resultFormat to be set to 'TestResultJSON'.`);
      resultJSON = null;
    }

    return new ConfigInput(errors, {
      at,
      displaySubmitButton,
      renderResultsAfterSubmit,
      resultFormat,
      resultJSON,
    });

    /**
     * @param {string} param
     * @param {boolean} defaultValue
     * @returns {boolean}
     */
    function decodeBooleanParam(param, defaultValue) {
      if (param === "true") {
        return true;
      } else if (param === "false") {
        return false;
      }
      return defaultValue;
    }
  }
}

class ScriptsInput {
  /**
   * @param {object} value
   * @param {SetupScripts} value.scripts
   * @private
   */
  constructor(value) {
    this.errors = [];

    /** @private */
    this._value = value;
  }

  scripts() {
    return this._value.scripts;
  }

  /**
   * @param {SetupScripts} scripts
   */
  static fromScriptsMap(scripts) {
    return new ScriptsInput({scripts});
  }

  /**
   * @param {{source: string}} script
   * @private
   */
  static scriptsFromSource(script) {
    return {[script.name]: new Function("testPageDocument", script.source)};
  }

  /**
   * @param {{modulePath: string}} script
   * @param {string} dataUrl
   * @private
   */
  static async scriptsFromModuleAsync(script, dataUrl) {
    return await import(`${dataUrl}/${script.modulePath}`);
  }

  /**
   * @param {{jsonpPath: string}} script
   * @param {string} dataUrl
   * @private
   */
  static async scriptsFromJsonpAsync(script, dataUrl) {
    return await Promise.race([
      new Promise(resolve => {
        window.scriptsJsonpLoaded = resolve;
        const scriptTag = document.createElement("script");
        scriptTag.src = script.jsonpPath;
        document.body.appendChild(scriptTag);
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Loading scripts timeout error")), 10000)),
    ]);
  }

  /**
   * @param {AriaATFile.CollectedTest} collectedAsync
   * @param {string} dataUrl url to directory where CollectedTest was loaded from
   */
  static async fromCollectedTestAsync({target: {setupScript}}, dataUrl) {
    if (!setupScript) {
      return new ScriptsInput({scripts: {}});
    }
    try {
      return new ScriptsInput({scripts: ScriptsInput.scriptsFromSource(setupScript)});
    } catch (error) {
      try {
        return new ScriptsInput({scripts: await ScriptsInput.scriptsFromModuleAsync(setupScript, dataUrl)});
      } catch (error2) {
        try {
          return new ScriptsInput({scripts: await ScriptsInput.scriptsFromJsonpAsync(setupScript, dataUrl)});
        } catch (error3) {
          throw new Error([error, error2, error3].map(error => error.stack || error.message).join("\n\n"));
        }
      }
    }
  }
}

class UnexpectedInput {
  /**
   * @param {object} value
   * @param {BehaviorUnexpectedItem[]} value.behaviors
   * @private
   */
  constructor(value) {
    this.errors = [];

    this._value = value;
  }

  behaviors() {
    return this._value.behaviors;
  }

  static fromBuiltin() {
    return new UnexpectedInput({
      behaviors: [
        ...UNEXPECTED_BEHAVIORS.map(description => ({description, requireExplanation: false})),
        {description: "Other", requireExplanation: true},
      ],
    });
  }
}

class TitleInput {
  /**
   * @param {object} value
   * @param {string} value.title
   * @private
   */
  constructor(value) {
    this.errors = [];

    /** @private */
    this._value = value;
  }

  title() {
    return this._value.title;
  }

  /** @param {string} title */
  static fromTitle(title) {
    return new TitleInput({
      title,
    });
  }
}

/** Depends on CommandsInput, ConfigInput, KeysInput, TitleInput, and UnexpectedInput. */
class BehaviorInput {
  /**
   * @param {object} value
   * @param {Behavior} value.behavior
   * @private
   */
  constructor(value) {
    this.errors = [];

    /** @private */
    this._value = value;
  }

  behavior() {
    return this._value.behavior;
  }

  /**
   * @param {BehaviorJSON} json
   * @param {object} data
   * @param {KeysInput} data.keysInput
   * @param {CommandsInput} data.commandsInput
   * @param {ConfigInput} data.configInput
   * @param {UnexpectedInput} data.unexpectedInput
   * @param {TitleInput} data.titleInput
   */
  static fromJSONCommandsConfigKeysTitleUnexpected(
    json,
    {commandsInput, configInput, keysInput, titleInput, unexpectedInput}
  ) {
    const mode = Array.isArray(json.mode) ? json.mode[0] : json.mode;
    const at = configInput.at();

    return new BehaviorInput({
      behavior: {
        description: titleInput.title(),
        task: json.task,
        mode,
        modeInstructions: keysInput.modeInstructions(mode),
        appliesTo: json.applies_to,
        specificUserInstruction: json.specific_user_instruction,
        setupScriptDescription: json.setup_script_description,
        setupTestPage: json.setupTestPage,
        commands: commandsInput.getCommands(json.task, mode),
        assertions: (json.output_assertions ? json.output_assertions : []).map(assertionTuple => ({
          priority: Number(assertionTuple[0]),
          assertion: assertionTuple[1],
        })),
        additionalAssertions: (json.additional_assertions ? json.additional_assertions[at.key] || [] : []).map(
          assertionTuple => ({
            priority: Number(assertionTuple[0]),
            assertion: assertionTuple[1],
          })
        ),
        unexpectedBehaviors: unexpectedInput.behaviors(),
      },
    });
  }

  /**
   * @param {AriaATFile.CollectedTest} collectedTest
   * @param {object} data
   * @param {CommandsInput} data.commandsInput
   * @param {KeysInput} data.keysInput
   * @param {UnexpectedInput} data.unexpectedInput
   */
  static fromCollectedTestCommandsKeysUnexpected(
    {info, target, instructions, assertions},
    {commandsInput, keysInput, unexpectedInput}
  ) {
    return new BehaviorInput({
      behavior: {
        description: info.title,
        task: info.task,
        mode: target.mode,
        modeInstructions: instructions.mode,
        appliesTo: [target.at.name],
        specificUserInstruction: instructions.raw,
        setupScriptDescription: target.setupScript ? target.setupScript.description : undefined,
        setupTestPage: target.setupScript ? target.setupScript.name : undefined,
        commands: commandsInput.getCommands(info.task, target.mode),
        assertions: assertions.map(({priority, expectation: assertion}) => ({
          priority,
          assertion,
        })),
        additionalAssertions: [],
        unexpectedBehaviors: unexpectedInput.behaviors(),
      },
    });
  }
}

class PageUriInput {
  /**
   * @param {object} value
   * @param {string} value.pageUri
   * @private
   */
  constructor(value) {
    this._errors = [];
    this._value = value;
  }

  pageUri() {
    return this._value.pageUri;
  }

  /**
   * @param {string} pageUri
   */
  static fromPageUri(pageUri) {
    return new PageUriInput({pageUri});
  }
}

export class TestRunInputOutput {
  constructor() {
    /** @type {BehaviorInput} */
    this.behaviorInput = null;
    /** @type {CommandsInput} */
    this.commandsInput = null;
    /** @type {ConfigInput} */
    this.configInput = null;
    /** @type {KeysInput} */
    this.keysInput = null;
    /** @type {PageUriInput} */
    this.pageUriInput = null;
    /** @type {ScriptsInput} */
    this.scriptsInput = null;
    /** @type {SupportInput} */
    this.supportInput = null;
    /** @type {TitleInput} */
    this.titleInput = null;
    /** @type {UnexpectedInput} */
    this.unexpectedInput = null;
  }

  /** @param {BehaviorInput} behaviorInput */
  setBehaviorInput(behaviorInput) {
    this.behaviorInput = behaviorInput;
  }

  /** @param {BehaviorJSON} behaviorJSON */
  setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected(behaviorJSON) {
    invariant(
      this.commandsInput !== null,
      "Call %s or %s before calling %s.",
      this.setCommandsInput.name,
      this.setCommandsInputFromJSONAndConfigKeys.name,
      this.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected.name
    );
    invariant(
      this.configInput !== null,
      "Call %s or %s before calling %s.",
      this.setConfigInput.name,
      this.setConfigInputFromQueryParamsAndSupport.name,
      this.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected.name
    );
    invariant(
      this.keysInput !== null,
      "Call %s or %s before calling %s.",
      this.setKeysInput.name,
      this.setKeysInputFromBuiltinAndConfig.name,
      this.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected.name
    );
    invariant(
      this.titleInput !== null,
      "Call %s or %s before calling %s.",
      this.setTitleInput.name,
      this.setTitleInputFromTitle.name,
      this.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected.name
    );
    invariant(
      this.unexpectedInput !== null,
      "Call %s or %s before calling %s.",
      this.setUnexpectedInput.name,
      this.setUnexpectedInputFromBuiltin.name,
      this.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected.name
    );

    this.setBehaviorInput(
      BehaviorInput.fromJSONCommandsConfigKeysTitleUnexpected(behaviorJSON, {
        commandsInput: this.commandsInput,
        configInput: this.configInput,
        keysInput: this.keysInput,
        titleInput: this.titleInput,
        unexpectedInput: this.unexpectedInput,
      })
    );
  }

  /**
   * Set all inputs but ConfigInput.
   * @param {AriaATFile.CollectedTest} collectedTest
   * @param {string} dataUrl url to directory where CollectedTest was loaded from
   */
  async setInputsFromCollectedTestAsync(collectedTest, dataUrl) {
    const pageUriInput = PageUriInput.fromPageUri(collectedTest.target.referencePage);
    const titleInput = TitleInput.fromTitle(collectedTest.info.title);
    const supportInput = SupportInput.fromCollectedTest(collectedTest);
    const scriptsInput = await ScriptsInput.fromCollectedTestAsync(collectedTest, dataUrl);

    const unexpectedInput = UnexpectedInput.fromBuiltin();
    const keysInput = KeysInput.fromCollectedTest(collectedTest);
    const commandsInput = CommandsInput.fromCollectedTestKeys(collectedTest, {keysInput});
    const behaviorInput = BehaviorInput.fromCollectedTestCommandsKeysUnexpected(collectedTest, {
      commandsInput,
      keysInput,
      unexpectedInput,
    });

    this.setTitleInput(titleInput);
    this.setPageUriInput(pageUriInput);
    this.setSupportInput(supportInput);
    this.setScriptsInput(scriptsInput);

    this.setUnexpectedInput(unexpectedInput);
    this.setKeysInput(keysInput);
    this.setCommandsInput(commandsInput);
    this.setBehaviorInput(behaviorInput);
  }

  /** @param {CommandsInput} commandsInput */
  setCommandsInput(commandsInput) {
    this.commandsInput = commandsInput;
  }

  /** @param {CommandsJSON} commandsJSON */
  setCommandsInputFromJSONAndConfigKeys(commandsJSON) {
    invariant(
      this.configInput !== null,
      "Call %s or %s before calling %s.",
      this.setConfigInput.name,
      this.setConfigInputFromQueryParamsAndSupport.name,
      this.setCommandsInputFromJSONAndConfigKeys.name
    );
    invariant(
      this.keysInput !== null,
      "Call %s or %s before calling %s.",
      this.setKeysInput.name,
      this.setKeysInputFromBuiltinAndConfig.name,
      this.setCommandsInputFromJSONAndConfigKeys.name
    );

    this.setCommandsInput(
      CommandsInput.fromJSONAndConfigKeys(commandsJSON, {
        configInput: this.configInput,
        keysInput: this.keysInput,
      })
    );
  }

  /** @param {ConfigInput} configInput */
  setConfigInput(configInput) {
    this.configInput = configInput;
  }

  /** @param {ConfigQueryParams} queryParams */
  setConfigInputFromQueryParamsAndSupport(queryParams) {
    invariant(
      this.supportInput !== null,
      "Call %s or %s before calling %s.",
      this.setSupportInput.name,
      this.setSupportInputFromJSON.name,
      this.setConfigInputFromQueryParamsAndSupport.name
    );

    this.setConfigInput(
      ConfigInput.fromQueryParamsAndSupport(queryParams, {
        supportInput: this.supportInput,
      })
    );
  }

  /** @param {KeysInput} keysInput */
  setKeysInput(keysInput) {
    this.keysInput = keysInput;
  }

  setKeysInputFromBuiltinAndConfig() {
    invariant(
      this.configInput !== null,
      "Call %s or %s before calling %s.",
      this.setConfigInput.name,
      this.setConfigInputFromQueryParamsAndSupport.name,
      this.setCommandsInputFromJSONAndConfigKeys.name
    );

    this.setKeysInput(KeysInput.fromBuiltinAndConfig({configInput: this.configInput}));
  }

  /** @param {PageUriInput} pageUriInput */
  setPageUriInput(pageUriInput) {
    this.pageUriInput = pageUriInput;
  }

  /** @param {string} pageUri */
  setPageUriInputFromPageUri(pageUri) {
    this.setPageUriInput(PageUriInput.fromPageUri(pageUri));
  }

  /** @param {ScriptsInput} scriptsInput */
  setScriptsInput(scriptsInput) {
    this.scriptsInput = scriptsInput;
  }

  /** @param {SetupScripts} scriptsMap */
  setScriptsInputFromMap(scriptsMap) {
    this.setScriptsInput(ScriptsInput.fromScriptsMap(scriptsMap));
  }

  /** @param {SupportInput} supportInput */
  setSupportInput(supportInput) {
    this.supportInput = supportInput;
  }

  /** @param {SupportJSON} supportJSON */
  setSupportInputFromJSON(supportJSON) {
    this.setSupportInput(SupportInput.fromJSON(supportJSON));
  }

  /** @param {TitleInput} titleInput */
  setTitleInput(titleInput) {
    this.titleInput = titleInput;
  }

  /** @param {string} title */
  setTitleInputFromTitle(title) {
    this.setTitleInput(TitleInput.fromTitle(title));
  }

  /** @param {UnexpectedInput} unexpectedInput */
  setUnexpectedInput(unexpectedInput) {
    this.unexpectedInput = unexpectedInput;
  }

  setUnexpectedInputFromBuiltin() {
    this.setUnexpectedInput(UnexpectedInput.fromBuiltin());
  }

  /** @returns {AriaATTestRun.State} */
  testRunState() {
    invariant(
      this.behaviorInput !== null,
      "Call %s or %s before calling %s.",
      this.setBehaviorInput.name,
      this.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected.name,
      this.testRunState.name
    );
    invariant(
      this.configInput !== null,
      "Call %s or %s before calling %s.",
      this.setConfigInput.name,
      this.setConfigInputFromQueryParamsAndSupport.name,
      this.testRunState.name
    );

    const errors = [...this.behaviorInput.errors, ...this.commandsInput.errors, ...this.configInput.errors];
    const test = this.behaviorInput.behavior();
    const config = this.configInput;

    let state = {
      errors,
      info: {
        description: test.description,
        task: test.task,
        mode: test.mode,
        modeInstructions: test.modeInstructions,
        userInstructions: test.specificUserInstruction.split("|"),
        setupScriptDescription: test.setupScriptDescription,
      },
      config: {
        at: config.at(),
        displaySubmitButton: config.displaySubmitButton(),
        renderResultsAfterSubmit: config.renderResultsAfterSubmit(),
      },
      currentUserAction: UserActionMap.LOAD_PAGE,
      openTest: {
        enabled: true,
      },
      commands: test.commands.map(
        command =>
          /** @type {import("./aria-at-test-run.mjs").TestRunCommand} */ ({
            description: command,
            atOutput: {
              highlightRequired: false,
              value: "",
            },
            assertions: test.assertions.map(assertion => ({
              description: assertion.assertion,
              highlightRequired: false,
              priority: assertion.priority,
              result: CommonResultMap.NOT_SET,
            })),
            additionalAssertions: test.additionalAssertions.map(assertion => ({
              description: assertion.assertion,
              highlightRequired: false,
              priority: assertion.priority,
              result: CommonResultMap.NOT_SET,
            })),
            unexpected: {
              highlightRequired: false,
              hasUnexpected: HasUnexpectedBehaviorMap.NOT_SET,
              tabbedBehavior: 0,
              behaviors: test.unexpectedBehaviors.map(({description, requireExplanation}) => ({
                description,
                checked: false,
                more: requireExplanation ? {highlightRequired: false, value: ""} : null,
              })),
            },
          })
      ),
    };

    if (this.configInput.resultJSON()) {
      state = this.testRunStateFromTestResultJSON(this.configInput.resultJSON(), state);
    }

    return state;
  }

  testWindowOptions() {
    invariant(
      this.behaviorInput !== null,
      "Call %s or %s before calling %s.",
      this.setBehaviorInput.name,
      this.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected.name,
      this.testWindowOptions.name
    );
    invariant(
      this.pageUriInput !== null,
      "Call %s or %s before calling %s.",
      this.setPageUriInput.name,
      this.setPageUriInputFromPageUri.name,
      this.testWindowOptions.name
    );
    invariant(
      this.scriptsInput !== null,
      "Call %s or %s before calling %s.",
      this.setScriptsInput.name,
      this.setScriptsInputFromMap.name,
      this.testWindowOptions.name
    );

    return {
      pageUri: this.pageUriInput.pageUri(),
      setupScriptName: this.behaviorInput.behavior().setupTestPage,
      scripts: this.scriptsInput.scripts(),
    };
  }

  /**
   * @param {AriaATTestRun.State} state
   * @returns {import("./aria-at-harness.mjs").SubmitResultJSON}
   */
  submitResultsJSON(state) {
    invariant(
      this.behaviorInput !== null,
      "Call %s or %s before calling %s.",
      this.setBehaviorInput.name,
      this.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected.name,
      this.submitResultsJSON.name
    );

    const behavior = this.behaviorInput.behavior();

    /** @type {SubmitResultDetailsJSON} */
    const details = {
      name: state.info.description,
      task: state.info.task,
      specific_user_instruction: behavior.specificUserInstruction,
      summary: {
        1: {
          pass: countAssertions(({priority, result}) => priority === 1 && result === CommonResultMap.PASS),
          fail: countAssertions(({priority, result}) => priority === 1 && result !== CommonResultMap.PASS),
        },
        2: {
          pass: countAssertions(({priority, result}) => priority === 2 && result === CommonResultMap.PASS),
          fail: countAssertions(({priority, result}) => priority === 2 && result !== CommonResultMap.PASS),
        },
        unexpectedCount: countUnexpectedBehaviors(({checked}) => checked),
      },
      commands: state.commands.map(command => ({
        command: command.description,
        output: command.atOutput.value,
        support: commandSupport(command),
        assertions: [...command.assertions, ...command.additionalAssertions].map(assertionToAssertion),
        unexpected_behaviors: command.unexpected.behaviors
          .filter(({checked}) => checked)
          .map(({description, more}) => (more ? more.value : description)),
      })),
    };

    /** @type {SubmitResultStatusJSON} */
    const status = state.commands.map(commandSupport).some(support => support === CommandSupportJSONMap.FAILING)
      ? StatusJSONMap.FAIL
      : StatusJSONMap.PASS;

    return {
      test: state.info.description,
      details,
      status,
    };

    function commandSupport(command) {
      const allAssertions = [...command.assertions, ...command.additionalAssertions];
      return allAssertions.some(({priority, result}) => priority === 1 && result !== CommonResultMap.PASS) ||
        command.unexpected.behaviors.some(({checked}) => checked)
        ? CommandSupportJSONMap.FAILING
        : allAssertions.some(({priority, result}) => priority === 2 && result !== CommonResultMap.PASS)
        ? CommandSupportJSONMap.ALL_REQUIRED
        : CommandSupportJSONMap.FULL;
    }

    /**
     * @param {(assertion: TestRunAssertion | TestRunAdditionalAssertion) => boolean} filter
     * @returns {number}
     */
    function countAssertions(filter) {
      return state.commands.reduce(
        (carry, command) => carry + [...command.assertions, ...command.additionalAssertions].filter(filter).length,
        0
      );
    }

    /**
     * @param {(behavior: TestRunUnexpected) => boolean} filter
     * @returns {number}
     */
    function countUnexpectedBehaviors(filter) {
      return state.commands.reduce((carry, command) => carry + command.unexpected.behaviors.filter(filter).length, 0);
    }

    /**
     * @param {TestRunAssertion | TestRunAdditionalAssertion} assertion
     * @returns {SubmitResultAssertionsJSON}
     */
    function assertionToAssertion(assertion) {
      return assertion.result === CommonResultMap.PASS
        ? {
            assertion: assertion.description,
            priority: assertion.priority.toString(),
            pass: AssertionPassJSONMap.GOOD_OUTPUT,
          }
        : {
            assertion: assertion.description,
            priority: assertion.priority.toString(),
            fail:
              assertion.result === AssertionResultMap.FAIL_MISSING
                ? AssertionFailJSONMap.NO_OUTPUT
                : assertion.result === AssertionResultMap.FAIL_INCORRECT
                ? AssertionFailJSONMap.INCORRECT_OUTPUT
                : AssertionFailJSONMap.NO_SUPPORT,
          };
    }
  }

  /**
   * Transform a test run state into a test result json for serialization.
   * @param {AriaATTestRun.State} state
   * @returns {AriaATTestResult.JSON}
   */
  testResultJSON(state) {
    return {
      test: {
        title: state.info.description,
        at: {
          id: state.config.at.key,
        },
        atMode: state.info.mode,
      },
      scenarioResults: state.commands.map(command => ({
        scenario: {
          command: {
            id: command.description,
          },
        },
        output: command.atOutput.value,
        assertionResults: command.assertions.map(assertion => ({
          assertion: {
            priority: assertion.priority === 1 ? "REQUIRED" : "OPTIONAL",
            text: assertion.description,
          },
          passed: assertion.result === "pass",
          failedReason:
            assertion.result === "failIncorrect"
              ? "INCORRECT_OUTPUT"
              : assertion.result === "failMissing"
              ? "NO_OUTPUT"
              : null,
        })),
        unexpectedBehaviors: command.unexpected.behaviors
          .map(behavior =>
            behavior.checked
              ? {
                  text: behavior.description,
                  otherUnexpectedBehaviorText: behavior.more ? behavior.more.value : null,
                }
              : null
          )
          .filter(Boolean),
      })),
    };
  }

  /**
   * @param {AriaATTestRun.State} state
   * @returns {SubmitResultJSON | AriaATTestResult.JSON}
   */
  resultJSON(state) {
    // If ConfigInput is available and resultFormat is TestResultJSON return result in that format.
    if (this.configInput !== null) {
      const resultFormat = this.configInput.resultFormat();
      if (resultFormat === "TestResultJSON") {
        return this.testResultJSON(state);
      }
    }

    return this.submitResultsJSON(state);
  }

  /**
   * Set a default or given test run state with the recorded results json. Intermediate state not stored into
   * testResult, like highlightRequired, is to the default.
   * @param {AriaATTestResult.JSON} testResult
   * @param {AriaATTestRun.State} [state]
   * @returns {AriaATTestRun.State}
   */
  testRunStateFromTestResultJSON(testResult, state = this.testRunState()) {
    return {
      ...state,
      commands: state.commands.map((command, commandIndex) => {
        const scenarioResult = testResult.scenarioResults[commandIndex];
        return {
          ...command,
          atOutput: {highlightRequired: false, value: scenarioResult.output},
          assertions: command.assertions.map((assertion, assertionIndex) => {
            const assertionResult = scenarioResult.assertionResults[assertionIndex];
            return {
              ...assertion,
              highlightRequired: false,
              result: assertionResult.passed
                ? "pass"
                : assertionResult.failedReason === "INCORRECT_OUTPUT"
                ? "failIncorrect"
                : assertionResult.failedReason === "NO_OUTPUT"
                ? "failMissing"
                : "notSet",
            };
          }),
          unexpected: {
            ...command.unexpected,
            highlightRequired: false,
            hasUnexpected: scenarioResult.unexpectedBehaviors.length > 0 ? "hasUnexpected" : "doesNotHaveUnexpected",
            tabbedBehavior: 0,
            behaviors: command.unexpected.behaviors.map(behavior => {
              const behaviorResult = scenarioResult.unexpectedBehaviors.find(
                unexpectedResult => unexpectedResult.text === behavior.description
              );
              return {
                ...behavior,
                checked: behaviorResult ? true : false,
                more: behavior.more
                  ? {
                      highlightRequired: false,
                      value: behaviorResult ? behaviorResult.otherUnexpectedBehaviorText : "",
                    }
                  : behavior.more,
              };
            }),
          },
        };
      }),
    };
  }
}

/**
 * Extended TestRun that can access methods to turn the TestRun["state"] into
 * the desired output format.
 */
export class TestRunExport extends TestRun {
  /**
   * @param {TestRunOptions & TestRunExportOptions} options
   */
  constructor({resultsJSON, ...parentOptions}) {
    super(parentOptions);

    this.resultsJSON = resultsJSON;
  }

  testPageAndResults() {
    const testPage = this.testPage();
    if ("results" in testPage) {
      return {
        ...testPage,
        resultsJSON: this.resultsJSON(this.state),
      };
    }
    return {
      ...testPage,
      resultsJSON:
        this.state.currentUserAction === UserActionMap.CLOSE_TEST_WINDOW ? this.resultsJSON(this.state) : null,
    };
  }
}

/**
 * @typedef SubmitResultDetailsCommandsAssertionsPass
 * @property {string} assertion
 * @property {string} priority
 * @property {AssertionPassJSON} pass
 */

/**
 * Passing assertion values submitted from the tester result form.
 *
 * In the submitted json object the values contain spaces and are title cased.
 * @typedef {EnumValues<typeof AssertionPassJSONMap>} AssertionPassJSON
 */

const AssertionPassJSONMap = createEnumMap({
  GOOD_OUTPUT: "Good Output",
});

/**
 * @typedef SubmitResultDetailsCommandsAssertionsFail
 * @property {string} assertion
 * @property {string} priority
 * @property {AssertionFailJSON} fail
 */

/**
 * Failing assertion values from the tester result form as are submitted in the
 * JSON result object.
 *
 * In the submitted json object the values contain spaces and are title cased.
 * @typedef {EnumValues<typeof AssertionFailJSONMap>} AssertionFailJSON
 */

const AssertionFailJSONMap = createEnumMap({
  NO_OUTPUT: "No Output",
  INCORRECT_OUTPUT: "Incorrect Output",
  NO_SUPPORT: "No Support",
});

/** @typedef {SubmitResultDetailsCommandsAssertionsPass | SubmitResultDetailsCommandsAssertionsFail} SubmitResultAssertionsJSON */

/**
 * Command result derived from priority 1 and 2 assertions.
 *
 * Support is "FAILING" is priority 1 assertions fail. Support is "ALL REQUIRED"
 * if priority 2 assertions fail.
 *
 * In the submitted json object values may contain spaces and are in ALL CAPS.
 *
 * @typedef {EnumValues<typeof CommandSupportJSONMap>} CommandSupportJSON
 */

const CommandSupportJSONMap = createEnumMap({
  FULL: "FULL",
  FAILING: "FAILING",
  ALL_REQUIRED: "ALL REQUIRED",
});

/**
 * Highest level status submitted from test result.
 *
 * In the submitted json object values are in ALL CAPS.
 *
 * @typedef {EnumValues<typeof StatusJSONMap>} SubmitResultStatusJSON
 */

const StatusJSONMap = createEnumMap({
  PASS: "PASS",
  FAIL: "FAIL",
});

/**
 * @param {boolean} test
 * @param {string} message
 * @param {any[]} args
 * @returns {asserts test}
 */
function invariant(test, message, ...args) {
  if (!test) {
    let index = 0;
    throw new Error(message.replace(/%%|%\w/g, match => (match[0] !== "%%" ? args[index++] : "%")));
  }
}

/** @typedef {ConstructorParameters<typeof TestRun>[0]} TestRunOptions */
/**
 * @typedef TestRunExportOptions
 * @property {(state: AriaATTestRun.State) => SubmitResultJSON} resultsJSON
 */

/**
 * @typedef ATJSON
 * @property {string} name
 * @property {string} key
 */

/**
 * @typedef SupportJSON
 * @property {ATJSON[]} ats
 * @property {object} applies_to
 * @property {object[]} examples
 * @property {string} examples[].directory
 * @property {string} examples[].name
 */

/**
 * @typedef {([string] | [string, string])[]} CommandATJSON
 */

/**
 * @typedef {{[atMode: string]: CommandATJSON}} CommandModeJSON
 */

/**
 * @typedef CommandJSON
 * @property {CommandModeJSON} [reading]
 * @property {CommandModeJSON} [interaction]
 */

/**
 * @typedef {{[commandDescription: string]: CommandJSON}} CommandsJSON
 */

/**
 * @typedef {["at" | "showSubmitButton" | "showResults" | string, string][]} ConfigQueryParams
 */

/** @typedef {"reading" | "interaction"} ATMode */

/**
 * @typedef BehaviorJSON
 * @property {string} setup_script_description
 * @property {string} setupTestPage
 * @property {string[]} applies_to
 * @property {ATMode | ATMode[]} mode
 * @property {string} task
 * @property {string} specific_user_instruction
 * @property {[string, string][]} [output_assertions]
 * @property {{[atKey: string]: [number, string][]}} [additional_assertions]
 */

/**
 * @typedef BehaviorAssertion
 * @property {number} priority
 * @property {string} assertion
 */

/**
 * @typedef BehaviorUnexpectedItem
 * @property {string} description
 * @property {boolean} requireExplanation
 */

/**
 * @typedef Behavior
 * @property {string} description
 * @property {string} task
 * @property {ATMode} mode
 * @property {string} modeInstructions
 * @property {string[]} appliesTo
 * @property {string} specificUserInstruction
 * @property {string} setupScriptDescription
 * @property {string} setupTestPage
 * @property {string[]} commands
 * @property {BehaviorAssertion[]} assertions
 * @property {BehaviorAssertion[]} additionalAssertions
 * @property {BehaviorUnexpectedItem[]} unexpectedBehaviors
 */

/** @typedef {{[key: string]: (document: Document) => void}} SetupScripts */

/**
 * @typedef SubmitResultJSON
 * @property {string} test
 * @property {SubmitResultDetailsJSON} details
 * @property {SubmitResultStatusJSON} status
 */

/**
 * @typedef SubmitResultSummaryPriorityJSON
 * @property {number} pass
 * @property {number} fail
 */

/**
 * @typedef {{[key in "1" | "2"]: SubmitResultSummaryPriorityJSON}} SubmitResultSummaryPriorityMapJSON
 */

/**
 * @typedef SubmitResultSummaryPropsJSON
 * @property {number} unexpectedCount
 */

/**
 * @typedef {SubmitResultSummaryPriorityMapJSON & SubmitResultSummaryPropsJSON} SubmitResultSummaryJSON
 */

/**
 * @typedef SubmitResultDetailsJSON
 * @property {string} name
 * @property {string} specific_user_instruction
 * @property {string} task
 * @property {object[]} commands
 * @property {string} commands[].command
 * @property {string} commands[].output
 * @property {string[]} commands[].unexpected_behaviors
 * @property {CommandSupportJSON} commands[].support
 * @property {SubmitResultAssertionsJSON[]} commands[].assertions
 * @property {SubmitResultSummaryJSON} summary
 */

/**
 * @typedef ResultJSONDocument
 * @property {SubmitResultJSON | null} resultsJSON
 */

/**
 * @typedef {TestPageDocument & ResultJSONDocument} TestPageAndResultsDocument
 */

/**
 * @typedef {import('./aria-at-test-run.mjs').EnumValues<T>} EnumValues<T>
 * @template T
 */

/** @typedef {import('./aria-at-test-run.mjs').TestRunAssertion} TestRunAssertion */
/** @typedef {import('./aria-at-test-run.mjs').TestRunAdditionalAssertion} TestRunAdditionalAssertion */
/** @typedef {import('./aria-at-test-run.mjs').TestRunCommand} TestRunCommand */
/** @typedef {import("./aria-at-test-run.mjs").TestRunUnexpectedBehavior} TestRunUnexpected */

/** @typedef {import('./aria-at-test-run.mjs').TestPageDocument} TestPageDocument */
