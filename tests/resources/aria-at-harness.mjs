import {commandsAPI} from "./at-commands.mjs";
import {element, fragment, property, attribute, className, style, focus, render} from "./vrender.mjs";
import {
  AssertionResultMap,
  CommonResultMap,
  createEnumMap,
  HasUnexpectedBehaviorMap,
  TestRun,
  UserActionMap,
  userCloseWindow,
  userOpenWindow,
  WhitespaceStyleMap,
} from "./aria-at-test-run.mjs";

const UNEXPECTED_BEHAVIORS = [
  "Output is excessively verbose, e.g., includes redundant and/or irrelevant speech",
  "Reading cursor position changed in an unexpected manner",
  "Screen reader became extremely sluggish",
  "Screen reader crashed",
  "Browser crashed",
];

const PAGE_STYLES = `
  table {
    border-collapse: collapse;
    margin-bottom: 1em;
  }

  table, td, th {
    border: 1px solid black;
  }

  td {
    padding: .5em;
  }

  table.record-results tr:first-child {
    font-weight: bold;
  }

  textarea {
    width: 100%
  }

  fieldset.problem-select {
   margin-top: 1em;
   margin-left: 1em;
  }

  .required:not(.highlight-required) {
    display: none;
  }

  .required-other:not(.highlight-required) {
    display: none;
  }

  .required.highlight-required {
    color: red;
  }

  fieldset.highlight-required {
    border-color: red;
  }

  fieldset .highlight-required {
    color: red;
  }

  .off-screen {
    position: absolute !important;
    height: 1px;
    width: 1px;
    overflow: hidden;
    clip: rect(1px, 1px, 1px, 1px);
    white-space: nowrap;
  }
`;

/** @type {string[]} */
const errors = [];
let showResults = true;
let showSubmitButton = true;

/** @type {AT} */
let at;
/** @type {CommandsAPI} */
let commapi;
/** @type {Behavior} */
let behavior;
/** @type {TestRunState} */
let firstState;

/**
 * @param {Support} newSupport
 * @param {Commands} newCommandsData
 */
export function initialize(newSupport, newCommandsData) {
  commapi = new commandsAPI(newCommandsData, newSupport);

  // Get the AT under test from the URL search params
  // set the showResults flag from the URL search params
  let params = new URL(document.location).searchParams;
  at = newSupport.ats[0];
  for (const [key, value] of params) {
    if (key === "at") {
      let requestedAT = value;
      if (commapi.isKnownAT(requestedAT)) {
        at = commapi.isKnownAT(requestedAT);
      } else {
        errors.push(
          `Harness does not have commands for the requested assistive technology ('${requestedAT}'), showing commands for assistive technology '${at.name}' instead. To test '${requestedAT}', please contribute command mappings to this project.`
        );
      }
    }
    if (key === "showResults") {
      if (value === "true") {
        showResults = true;
      } else if (value === "false") {
        showResults = false;
      }
    }
    if (key === "showSubmitButton") {
      if (value === "true") {
        showSubmitButton = true;
      } else if (value === "false") {
        showSubmitButton = false;
      }
    }
  }
}

/**
 * @param {BehaviorJSON} atBehavior
 */
export function verifyATBehavior(atBehavior) {
  // This is temporary until transition is complete from multiple modes to one mode
  let mode = typeof atBehavior.mode === "string" ? atBehavior.mode : atBehavior.mode[0];

  /** @type {Behavior} */
  behavior = {
    description: document.title,
    task: atBehavior.task,
    mode,
    modeInstructions: commapi.getModeInstructions(mode, at),
    appliesTo: atBehavior.applies_to,
    specificUserInstruction: atBehavior.specific_user_instruction,
    setupScriptDescription: atBehavior.setup_script_description,
    setupTestPage: atBehavior.setupTestPage,
    commands: commapi.getATCommands(mode, atBehavior.task, at),
    outputAssertions: atBehavior.output_assertions ? atBehavior.output_assertions : [],
    additionalAssertions: atBehavior.additional_assertions ? atBehavior.additional_assertions[at.key] || [] : [],
    unexpectedBehaviors: [
      ...UNEXPECTED_BEHAVIORS.map(content => ({content})),
      {content: "Other", requireExplanation: true},
    ],
  };

  if (!firstState && behavior.commands.length) {
    firstState = initializeTestRunState({
      errors: errors.length ? errors : null,
      test: behavior,
      config: {at, displaySubmitButton: showSubmitButton, renderResultsAfterSubmit: showResults},
    });
  } else {
    throw new Error("Test files should only contain one verifyATBehavior call.");
  }
}

export function displayTestPageAndInstructions(testPage) {
  if (document.readyState !== "complete") {
    window.setTimeout(() => {
      displayTestPageAndInstructions(testPage);
    }, 100);
    return;
  }

  document.querySelector("html").setAttribute("lang", "en");
  var style = document.createElement("style");
  style.innerHTML = PAGE_STYLES;
  document.head.appendChild(style);

  displayInstructionsForBehaviorTest(testPage, behavior);
}

/**
 * @param {string} testPage
 * @param {Behavior} behavior
 */
function displayInstructionsForBehaviorTest(testPage, behavior) {
  const windowManager = new TestWindow({
    pageUri: testPage,
    setupScriptName: behavior.setupTestPage,
    scripts: typeof scripts === "object" ? scripts : {},
    hooks: {
      windowOpened() {
        app.dispatch(userOpenWindow());
      },
      windowClosed() {
        app.dispatch(userCloseWindow());
      },
    },
  });

  // First, execute necesary set up script in test page if the test page is open from a previous behavior test
  windowManager.prepare();

  const app = new TestRunExport({
    behavior,
    hooks: {
      openTestPage() {
        windowManager.open();
      },
      closeTestPage() {
        windowManager.close();
      },
      postResults: () => postResults(app),
    },
    state: firstState,
  });
  app.observe(() => {
    render(document.body, renderVirtualTestPage(app.testPageAndResults()));
  });
  render(document.body, renderVirtualTestPage(app.testPageAndResults()));

  // if test is loaded in iFrame
  if (window.parent && window.parent.postMessage) {
    // results can be submitted by parent posting a message to the
    // iFrame with a data.type property of 'submit'
    window.addEventListener("message", function (message) {
      if (!validateMessage(message, "submit")) return;
      app.hooks.submit();
    });

    // send message to parent that test has loaded
    window.parent.postMessage(
      {
        type: "loaded",
        data: {
          testPageUri: windowManager.pageUri,
        },
      },
      "*"
    );
  }
}

function validateMessage(message, type) {
  if (window.location.origin !== message.origin) {
    return false;
  }
  if (!message.data || typeof message.data !== "object") {
    return false;
  }
  if (message.data.type !== type) {
    return false;
  }
  return true;
}

/**
 * @param {TestRunExport} app
 */
function postResults(app) {
  // send message to parent if test is loaded in iFrame
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage(
      {
        type: "results",
        data: app.resultsJSON(),
      },
      "*"
    );
  }
}

/** @typedef {ConstructorParameters<typeof TestRun>[0]} TestRunOptions */
/**
 * @typedef TestRunExportOptions
 * @property {Behavior} behavior
 */

class TestRunExport extends TestRun {
  /**
   * @param {TestRunOptions & TestRunExportOptions} options
   */
  constructor({behavior, ...parentOptions}) {
    super(parentOptions);

    this.behavior = behavior;
  }

  testPageAndResults() {
    const testPage = this.testPage();
    if ("results" in testPage) {
      return {
        ...testPage,
        resultsJSON: this.resultsJSON(),
      };
    }
    return {
      ...testPage,
      resultsJSON: this.state.currentUserAction === UserActionMap.CLOSE_TEST_WINDOW ? this.resultsJSON() : null,
    };
  }

  resultsJSON() {
    return toSubmitResultJSON(this.state, this.behavior);
  }
}

class TestWindow {
  /**
   * @param {object} options
   * @param {Window | null} [options.window]
   * @param {string} options.pageUri
   * @param {string} [options.setupScriptName]
   * @param {TestWindowHooks} [options.hooks]
   * @param {SetupScripts} [options.scripts]
   */
  constructor({window = null, pageUri, setupScriptName, hooks, scripts = {}}) {
    /** @type {Window | null} */
    this.window = window;

    /** @type {string} */
    this.pageUri = pageUri;

    /** @type {string} */
    this.setupScriptName = setupScriptName;

    /** @type {TestWindowHooks} */
    this.hooks = {
      windowOpened: () => {},
      windowClosed: () => {},
      ...hooks,
    };

    /** @type {SetupScripts} */
    this.scripts = scripts;
  }

  open() {
    this.window = window.open(this.pageUri, "_blank", "toolbar=0,location=0,menubar=0,width=400,height=400");

    this.hooks.windowOpened();

    // If the window is closed, re-enable open popup button
    this.window.onunload = () => {
      window.setTimeout(() => {
        if (this.window.closed) {
          this.window = undefined;

          this.hooks.windowClosed();
        }
      }, 100);
    };

    this.prepare();
  }

  prepare() {
    if (!this.window) {
      return;
    }

    let setupScriptName = this.setupScriptName;
    if (!setupScriptName) {
      return;
    }
    if (
      this.window.location.origin !== window.location.origin || // make sure the origin is the same, and prevent this from firing on an 'about' page
      this.window.document.readyState !== "complete"
    ) {
      window.setTimeout(() => {
        this.prepare();
      }, 100);
      return;
    }

    this.scripts[setupScriptName](this.window.document);
  }

  close() {
    if (this.window) {
      this.window.close();
    }
  }
}

function bind(fn, ...args) {
  return (...moreArgs) => fn(...args, ...moreArgs);
}

/**
 * @param {object} options
 * @param {string[] | null} [options.errors]
 * @param {Behavior} options.test
 * @param {object} options.config
 * @param {AT} options.config.at
 * @param {boolean} [options.config.displaySubmitButton]
 * @param {boolean} [options.config.renderResultsAfterSubmit]
 * @returns {TestRunState}
 */
function initializeTestRunState({
  errors = null,
  test,
  config: {at, displaySubmitButton = true, renderResultsAfterSubmit = true},
}) {
  return {
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
      at,
      displaySubmitButton,
      renderResultsAfterSubmit,
    },
    currentUserAction: UserActionMap.LOAD_PAGE,
    openTest: {
      enabled: true,
    },
    commands: test.commands.map(
      command =>
        /** @type {TestRunCommand} */ ({
          description: command,
          atOutput: {
            highlightRequired: false,
            value: "",
          },
          assertions: test.outputAssertions.map(assertion => ({
            description: assertion[1],
            highlightRequired: false,
            priority: Number(assertion[0]),
            result: CommonResultMap.NOT_SET,
          })),
          additionalAssertions: test.additionalAssertions.map(assertion => ({
            description: assertion[1],
            highlightRequired: false,
            priority: Number(assertion[0]),
            result: CommonResultMap.NOT_SET,
          })),
          unexpected: {
            highlightRequired: false,
            hasUnexpected: HasUnexpectedBehaviorMap.NOT_SET,
            tabbedBehavior: 0,
            behaviors: test.unexpectedBehaviors.map(({content: description, requireExplanation}) => ({
              description,
              checked: false,
              more: requireExplanation ? {highlightRequired: false, value: ""} : null,
            })),
          },
        })
    ),
  };
}

const a = bind(element, "a");
const br = bind(element, "br");
const button = bind(element, "button");
const div = bind(element, "div");
const em = bind(element, "em");
const fieldset = bind(element, "fieldset");
const h1 = bind(element, "h1");
const h2 = bind(element, "h2");
const h3 = bind(element, "h3");
const hr = bind(element, "hr");
const input = bind(element, "input");
const label = bind(element, "label");
const legend = bind(element, "legend");
const li = bind(element, "li");
const ol = bind(element, "ol");
const p = bind(element, "p");
const script = bind(element, "script");
const section = bind(element, "section");
const span = bind(element, "span");
const table = bind(element, "table");
const td = bind(element, "td");
const textarea = bind(element, "textarea");
const th = bind(element, "th");
const tr = bind(element, "tr");
const ul = bind(element, "ul");

const forInput = bind(attribute, "for");
const href = bind(attribute, "href");
const id = bind(attribute, "id");
const name = bind(attribute, "name");
const tabIndex = bind(attribute, "tabindex");
const textContent = bind(attribute, "textContent");
const type = bind(attribute, "type");

const value = bind(property, "value");
const checked = bind(property, "checked");
const disabled = bind(property, "disabled");

/** @type {(cb: (ev: MouseEvent) => void) => any} */
const onclick = bind(property, "onclick");
/** @type {(cb: (ev: InputEvent) => void) => any} */
const onchange = bind(property, "onchange");
/** @type {(cb: (ev: KeyboardEvent) => void) => any} */
const onkeydown = bind(property, "onkeydown");

/**
 * @param {Description} value
 */
function rich(value) {
  if (typeof value === "string") {
    return value;
  } else if (Array.isArray(value)) {
    return fragment(...value.map(rich));
  } else {
    if ("whitespace" in value) {
      if (value.whitespace === WhitespaceStyleMap.LINE_BREAK) {
        return br();
      }
      return null;
    }
    return (value.href ? a.bind(null, href(value.href)) : span)(
      className([
        value.offScreen ? "off-screen" : "",
        value.required ? "required" : "",
        value.highlightRequired ? "highlight-required" : "",
      ]),
      rich(value.description)
    );
  }
}

/**
 * @param {TestPageAndResultsDocument} doc
 */
function renderVirtualTestPage(doc) {
  return fragment(
    "instructions" in doc
      ? div(
          section(
            id("errors"),
            style({display: doc.errors ? "block" : "none"}),
            h2("Test cannot be performed due to error(s)!"),
            ul(...(doc.errors ? doc.errors.map(error => li(error)) : [])),
            hr()
          ),
          section(id("instructions"), renderVirtualInstructionDocument(doc.instructions)),
          section(id("record-results"))
        )
      : null,
    "results" in doc ? renderVirtualResultsTable(doc.results) : null,
    doc.resultsJSON
      ? script(type("text/json"), id("__ariaatharness__results__"), textContent(JSON.stringify(doc.resultsJSON)))
      : null
  );
}

/**
 * @param doc {InstructionDocument}
 */
function renderVirtualInstructionDocument(doc) {
  function compose(...fns) {
    return around => fns.reduceRight((carry, fn) => fn(carry), around);
  }

  const map = (ary, el) => ary.map(item => el(item));

  return div(
    instructionHeader(doc.instructions),

    instructCommands(doc.instructions.instructions),

    instructAssertions(doc.instructions.assertions),

    button(
      disabled(!doc.instructions.openTestPage.enabled),
      onclick(doc.instructions.openTestPage.click),
      rich(doc.instructions.openTestPage.button)
    ),

    resultHeader(doc.results.header),

    section(...doc.results.commands.map(commandResult)),

    doc.submit ? button(onclick(doc.submit.click), rich(doc.submit.button)) : null
  );

  /**
   * @param {InstructionDocumentResultsHeader} param0
   */
  function resultHeader({header, description}) {
    return fragment(h2(rich(header)), p(rich(description)));
  }

  /**
   * @param {InstructionDocumentResultsCommand} command
   * @param {number} commandIndex
   */
  function commandResult(command, commandIndex) {
    return fragment(
      h3(rich(command.header)),
      p(
        label(rich(command.atOutput.description)),
        textarea(
          value(command.atOutput.value),
          focus(command.atOutput.focus),
          onchange(ev => command.atOutput.change(/** @type {HTMLInputElement} */ (ev.currentTarget).value))
        )
      ),
      table(
        tr(
          th(rich(command.assertionsHeader.descriptionHeader)),
          th(rich(command.assertionsHeader.passHeader)),
          th(rich(command.assertionsHeader.failHeader))
        ),
        ...command.assertions.map(bind(commandResultAssertion, commandIndex))
      ),
      ...[command.unexpectedBehaviors].map(bind(commandResultUnexpectedBehavior, commandIndex))
    );
  }

  /**
   * @param {number} commandIndex
   * @param {InstructionDocumentResultsCommandsUnexpected} unexpected
   */
  function commandResultUnexpectedBehavior(commandIndex, unexpected) {
    return fieldset(
      id(`cmd-${commandIndex}-problem`),
      rich(unexpected.description),
      div(radioChoice(`problem-${commandIndex}-true`, `problem-${commandIndex}`, unexpected.passChoice)),
      div(radioChoice(`problem-${commandIndex}-false`, `problem-${commandIndex}`, unexpected.failChoice)),
      fieldset(
        className(["problem-select"]),
        id(`cmd-${commandIndex}-problem-checkboxes`),
        legend(rich(unexpected.failChoice.options.header)),
        ...unexpected.failChoice.options.options.map(failOption =>
          fragment(
            input(
              type("checkbox"),
              value(failOption.description),
              id(`${failOption.description}-${commandIndex}`),
              className([`undesirable-${commandIndex}`]),
              tabIndex(failOption.tabbable ? "0" : "-1"),
              disabled(!failOption.enabled),
              checked(failOption.checked),
              focus(failOption.focus),
              onchange(ev => failOption.change(/** @type {HTMLInputElement} */ (ev.currentTarget).checked)),
              onkeydown(ev => {
                if (failOption.keydown(ev.key)) {
                  ev.stopPropagation();
                  ev.preventDefault();
                }
              })
            ),
            label(forInput(`${failOption.description}-${commandIndex}`), rich(failOption.description)),
            br(),
            failOption.more
              ? div(
                  label(forInput(`${failOption.description}-${commandIndex}-input`), rich(failOption.more.description)),
                  input(
                    type("text"),
                    id(`${failOption.description}-${commandIndex}-input`),
                    name(`${failOption.description}-${commandIndex}-input`),
                    className(["undesirable-other-input"]),
                    disabled(!failOption.more.enabled),
                    value(failOption.more.value),
                    onchange(ev => failOption.more.change(/** @type {HTMLInputElement} */ (ev.currentTarget).value))
                  )
                )
              : fragment()
          )
        )
      )
    );
  }

  /**
   * @param {number} commandIndex
   * @param {InstructionDocumentResultsCommandsAssertion} assertion
   * @param {number} assertionIndex
   */
  function commandResultAssertion(commandIndex, assertion, assertionIndex) {
    return tr(
      td(rich(assertion.description)),
      td(
        ...[assertion.passChoice].map(choice =>
          radioChoice(`pass-${commandIndex}-${assertionIndex}`, `result-${commandIndex}-${assertionIndex}`, choice)
        )
      ),
      td(
        ...assertion.failChoices.map((choice, failIndex) =>
          radioChoice(
            `${failIndex === 0 ? "missing" : "fail"}-${commandIndex}-${assertionIndex}`,
            `result-${commandIndex}-${assertionIndex}`,
            choice
          )
        )
      )
    );
  }

  /**
   * @param {string} idKey
   * @param {string} nameKey
   * @param {InstructionDocumentAssertionChoice} choice
   */
  function radioChoice(idKey, nameKey, choice) {
    return fragment(
      input(
        type("radio"),
        id(idKey),
        name(nameKey),
        checked(choice.checked),
        focus(choice.focus),
        onclick(choice.click)
      ),
      label(id(`${idKey}-label`), forInput(`${idKey}`), rich(choice.label))
    );
  }

  /**
   * @param {InstructionDocumentInstructionsInstructions} param0
   * @returns
   */
  function instructCommands({header, instructions, strongInstructions: boldInstructions, commands}) {
    return fragment(
      h2(rich(header)),
      ol(
        ...map(instructions, compose(li, rich)),
        ...map(boldInstructions, compose(li, em, rich)),
        li(rich(commands.description), ul(...map(commands.commands, compose(li, em, rich))))
      )
    );
  }

  /**
   * @param {InstructionDocumentInstructions} param0
   */
  function instructionHeader({header, description}) {
    return fragment(
      h1(id("behavior-header"), tabIndex("0"), focus(header.focus), rich(header.header)),
      p(rich(description))
    );
  }

  /**
   * @param {InstructionDocumentInstructionsAssertions} param0
   */
  function instructAssertions({header, description, assertions}) {
    return fragment(h2(rich(header)), p(rich(description)), ol(...map(assertions, compose(li, em, rich))));
  }
}

/**
 * @param {ResultsTableDocument} results
 */
function renderVirtualResultsTable(results) {
  return fragment(
    h1(rich(results.header)),
    h2(id("overallstatus"), rich(results.status.header)),

    table(
      (({description, support, details}) => tr(th(description), th(support), th(details)))(results.table.headers),
      results.table.commands.map(
        ({description, support, details: {output, passingAssertions, failingAssertions, unexpectedBehaviors}}) =>
          fragment(
            tr(
              td(rich(description)),
              td(rich(support)),
              td(
                p(rich(output)),
                commandDetailsList(passingAssertions),
                commandDetailsList(failingAssertions),
                commandDetailsList(unexpectedBehaviors)
              )
            )
          )
      )
    )
  );

  /**
   * @param {object} list
   * @param {Description} list.description
   * @param {Description[]} list.items
   */
  function commandDetailsList({description, items}) {
    return div(description, ul(...items.map(description => li(rich(description)))));
  }
}

/**
 * @typedef SubmitResultDetailsCommandsAssertionsPass
 * @property {string} assertion
 * @property {string} priority
 * @property {EnumValues<typeof AssertionPassJSONMap>} pass
 */

const AssertionPassJSONMap = createEnumMap({
  GOOD_OUTPUT: "Good Output",
});

/**
 * @typedef SubmitResultDetailsCommandsAssertionsFail
 * @property {string} assertion
 * @property {string} priority
 * @property {EnumValues<typeof AssertionFailJSONMap>} fail
 */

const AssertionFailJSONMap = createEnumMap({
  NO_OUTPUT: "No Output",
  INCORRECT_OUTPUT: "Incorrect Output",
  NO_SUPPORT: "No Support",
});

/** @typedef {SubmitResultDetailsCommandsAssertionsPass | SubmitResultDetailsCommandsAssertionsFail} SubmitResultAssertionsJSON */

/** @typedef {EnumValues<typeof CommandSupportJSONMap>} CommandSupportJSON */

const CommandSupportJSONMap = createEnumMap({
  FULL: "FULL",
  FAILING: "FAILING",
  ALL_REQUIRED: "ALL REQUIRED",
});

/**
 * @typedef {EnumValues<typeof StatusJSONMap>} SubmitResultStatusJSON
 */

const StatusJSONMap = createEnumMap({
  PASS: "PASS",
  FAIL: "FAIL",
});

/**
 * @param {TestRunState} state
 * @param {Behavior} behavior
 * @returns {SubmitResultJSON}
 */
function toSubmitResultJSON(state, behavior) {
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
 * @typedef AT
 * @property {string} name
 * @property {string} key
 */

/**
 * @typedef Support
 * @property {AT[]} ats
 * @property {{system: string[]}} applies_to
 * @property {{directory: string, name: string}[]} examples
 */

/**
 * @typedef {{[mode in ATMode]: {[atName: string]: string;};}} CommandsAPI_ModeInstructions
 */

/**
 * @typedef {([string] | [string, string])[]} CommandAT
 */

/**
 * @typedef {{[atMode: string]: CommandAT}} CommandMode
 */

/**
 * @typedef Command
 * @property {CommandMode} [reading]
 * @property {CommandMode} [interaction]
 */

/**
 * @typedef {{[commandDescription: string]: Command}} Commands
 */

/**
 * @callback CommandsAPI_getATCommands
 * @param {ATMode} mode
 * @param {string} task
 * @param {AT} assistiveTech
 * @returns {string[]}
 */

/** @typedef {"reading" | "interaction"} ATMode */

/**
 * @callback CommandsAPI_getModeInstructions
 * @param {ATMode} mode
 * @param {AT} assistiveTech
 * @returns {string}
 */

/**
 * @callback CommandsAPI_isKnownAT
 * @param {string} assistiveTech
 * @returns {AT}
 */

/**
 * @typedef CommandsAPI
 * @property {Commands} AT_COMMAND_MAP
 * @property {CommandsAPI_ModeInstructions} MODE_INSTRUCTIONS
 * @property {Support} support
 * @property {CommandsAPI_getATCommands} getATCommands
 * @property {CommandsAPI_getModeInstructions} getModeInstructions
 * @property {CommandsAPI_isKnownAT} isKnownAT
 */

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
 * @property {[string, string][]} outputAssertions
 * @property {[number, string][]} additionalAssertions
 * @property {object[]} unexpectedBehaviors
 * @property {string} unexpectedBehaviors[].content
 * @property {boolean} [unexpectedBehaviors[].requireExplanation]
 */

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
 * @typedef TestWindowHooks
 * @property {() => void} windowOpened
 * @property {() => void} windowClosed
 */

/** @typedef {{[key: string]: (document: Document) => void}} SetupScripts */

/**
 * @typedef ResultJSONDocument
 * @property {SubmitResultJSON | null} resultsJSON
 */

/**
 * @typedef {TestPageDocument & ResultJSONDocument} TestPageAndResultsDocument
 */

/**
 * @typedef {import('./aria-at-test-run.js').EnumValues<T>} EnumValues<T>
 * @template T
 */

/** @typedef {import('./aria-at-test-run.js').TestRunState} TestRunState */
/** @typedef {import('./aria-at-test-run.js').TestRunAssertion} TestRunAssertion */
/** @typedef {import('./aria-at-test-run.js').TestRunAdditionalAssertion} TestRunAdditionalAssertion */
/** @typedef {import('./aria-at-test-run.js').TestRunCommand} TestRunCommand */
/** @typedef {import("./aria-at-test-run.js").TestRunUnexpectedBehavior} TestRunUnexpected */

/** @typedef {import('./aria-at-test-run.js').Description} Description */

/** @typedef {import('./aria-at-test-run.js').TestPageDocument} TestPageDocument */

/** @typedef {import('./aria-at-test-run.js').InstructionDocument} InstructionDocument */
/** @typedef {import('./aria-at-test-run.js').InstructionDocumentInstructions} InstructionDocumentInstructions */
/** @typedef {import('./aria-at-test-run.js').InstructionDocumentInstructionsAssertions} InstructionDocumentInstructionsAssertions */
/** @typedef {import('./aria-at-test-run.js').InstructionDocumentResultsHeader} InstructionDocumentResultsHeader */
/** @typedef {import('./aria-at-test-run.js').InstructionDocumentResultsCommand} InstructionDocumentResultsCommand */
/** @typedef {import('./aria-at-test-run.js').InstructionDocumentResultsCommandsUnexpected} InstructionDocumentResultsCommandsUnexpected */
/** @typedef {import("./aria-at-test-run.js").InstructionDocumentResultsCommandsAssertion} InstructionDocumentResultsCommandsAssertion */
/** @typedef {import("./aria-at-test-run.js").InstructionDocumentAssertionChoice} InstructionDocumentAssertionChoice */
/** @typedef {import("./aria-at-test-run.js").InstructionDocumentInstructionsInstructions} InstructionDocumentInstructionsInstructions */

/** @typedef {import('./aria-at-test-run.js').ResultsTableDocument} ResultsTableDocument */
