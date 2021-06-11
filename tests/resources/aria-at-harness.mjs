import {element, fragment, property, attribute, className, style, focus, render} from "./vrender.mjs";
import {userCloseWindow, userOpenWindow, WhitespaceStyleMap} from "./aria-at-test-run.mjs";
import {TestRunExport, TestRunInputOutput} from "./aria-at-test-io-format.mjs";
import {TestWindow} from "./aria-at-test-window.mjs";

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

let testRunIO = new TestRunInputOutput();
testRunIO.setTitleInputFromTitle(document.title);
testRunIO.setUnexpectedInputFromBuiltin();
testRunIO.setScriptsInputFromMap(typeof scripts === "object" ? scripts : {});

/**
 * @param {SupportJSON} newSupport
 * @param {CommandsJSON} newCommandsData
 */
export function initialize(newSupport, newCommandsData) {
  testRunIO.setSupportInputFromJSON(newSupport);
  testRunIO.setConfigInputFromQueryParamsAndSupport(Array.from(new URL(document.location).searchParams));
  testRunIO.setKeysInputFromBuiltinAndConfig();
  testRunIO.setCommandsInputFromJSONAndConfigKeys(newCommandsData);
}

/**
 * @param {BehaviorJSON} atBehavior
 */
export function verifyATBehavior(atBehavior) {
  if (testRunIO.behaviorInput !== null) {
    throw new Error("Test files should only contain one verifyATBehavior call.");
  }

  testRunIO.setBehaviorInputFromJSONAndCommandsConfigKeysTitleUnexpected(atBehavior);
}

export function displayTestPageAndInstructions(testPage) {
  if (document.readyState !== "complete") {
    window.setTimeout(() => {
      displayTestPageAndInstructions(testPage);
    }, 100);
    return;
  }

  testRunIO.setPageUriInputFromPageUri(testPage);

  document.querySelector("html").setAttribute("lang", "en");
  var style = document.createElement("style");
  style.innerHTML = PAGE_STYLES;
  document.head.appendChild(style);

  displayInstructionsForBehaviorTest();
}

function displayInstructionsForBehaviorTest() {
  const windowManager = new TestWindow({
    ...testRunIO.testWindowOptions(),
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
    hooks: {
      openTestPage() {
        windowManager.open();
      },
      closeTestPage() {
        windowManager.close();
      },
      postResults: () => postResults(testRunIO.submitResultsJSON(app.state)),
    },
    state: testRunIO.testRunState(),
    resultsJSON: state => testRunIO.submitResultsJSON(state),
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
 * @param {resultsJSON} resultsJSON
 */
function postResults(resultsJSON) {
  // send message to parent if test is loaded in iFrame
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage(
      {
        type: "results",
        data: resultsJSON,
      },
      "*"
    );
  }
}

function bind(fn, ...args) {
  return (...moreArgs) => fn(...args, ...moreArgs);
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

/** @typedef {import('./aria-at-test-io-format.js').SupportJSON} SupportJSON */
/** @typedef {import('./aria-at-test-io-format.js').CommandsJSON} CommandsJSON */
/** @typedef {import('./aria-at-test-io-format.js').BehaviorJSON} BehaviorJSON */

/** @typedef {import('./aria-at-test-run.mjs').TestRunState} TestRunState */

/** @typedef {import('./aria-at-test-run.mjs').Description} Description */

/** @typedef {import('./aria-at-test-run.mjs').InstructionDocument} InstructionDocument */
/** @typedef {import('./aria-at-test-run.mjs').InstructionDocumentInstructions} InstructionDocumentInstructions */
/** @typedef {import('./aria-at-test-run.mjs').InstructionDocumentInstructionsAssertions} InstructionDocumentInstructionsAssertions */
/** @typedef {import('./aria-at-test-run.mjs').InstructionDocumentResultsHeader} InstructionDocumentResultsHeader */
/** @typedef {import('./aria-at-test-run.mjs').InstructionDocumentResultsCommand} InstructionDocumentResultsCommand */
/** @typedef {import('./aria-at-test-run.mjs').InstructionDocumentResultsCommandsUnexpected} InstructionDocumentResultsCommandsUnexpected */
/** @typedef {import("./aria-at-test-run.mjs").InstructionDocumentResultsCommandsAssertion} InstructionDocumentResultsCommandsAssertion */
/** @typedef {import("./aria-at-test-run.mjs").InstructionDocumentAssertionChoice} InstructionDocumentAssertionChoice */
/** @typedef {import("./aria-at-test-run.mjs").InstructionDocumentInstructionsInstructions} InstructionDocumentInstructionsInstructions */

/** @typedef {import('./aria-at-test-run.mjs').ResultsTableDocument} ResultsTableDocument */

/**
 * @typedef {import('./aria-at-test-io-format.js').TestPageAndResultsDocument} TestPageAndResultsDocument
 */
