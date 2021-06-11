export class TestRun {
  /**
   * @param {object} param0
   * @param {Partial<TestRunHooks>} [param0.hooks]
   * @param {TestRunState} param0.state
   */
  constructor({hooks, state}) {
    /** @type {TestRunState} */
    this.state = state;

    const bindDispatch = transform => arg => this.dispatch(transform(arg));
    /** @type {TestRunHooks} */
    this.hooks = {
      closeTestPage: bindDispatch(userCloseWindow),
      focusCommandUnexpectedBehavior: bindDispatch(userFocusCommandUnexpectedBehavior),
      openTestPage: bindDispatch(userOpenWindow),
      postResults: () => {},
      setCommandAdditionalAssertion: bindDispatch(userChangeCommandAdditionalAssertion),
      setCommandAssertion: bindDispatch(userChangeCommandAssertion),
      setCommandHasUnexpectedBehavior: bindDispatch(userChangeCommandHasUnexpectedBehavior),
      setCommandUnexpectedBehavior: bindDispatch(userChangeCommandUnexpectedBehavior),
      setCommandUnexpectedBehaviorMore: bindDispatch(userChangeCommandUnexpectedBehaviorMore),
      setCommandOutput: bindDispatch(userChangeCommandOutput),
      submit: () => submitResult(this),
      ...hooks,
    };

    this.observers = [];

    this.dispatch = this.dispatch.bind(this);
  }

  /**
   * @param {(state: TestRunState) => TestRunState} updateMethod
   */
  dispatch(updateMethod) {
    this.state = updateMethod(this.state);
    this.observers.forEach(subscriber => subscriber(this));
  }

  /**
   * @param {(app: TestRun) => void} subscriber
   * @returns {() => void}
   */
  observe(subscriber) {
    this.observers.push(subscriber);
    return () => {
      const index = this.observers.indexOf(subscriber);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  testPage() {
    return testPageDocument(this.state, this.hooks);
  }

  instructions() {
    return instructionDocument(this.state, this.hooks);
  }

  resultsTable() {
    return resultsTableDocument(this.state);
  }
}

/**
 * @param {U} map
 * @returns {Readonly<U>}
 * @template {string} T
 * @template {{[key: string]: T}} U
 */
export function createEnumMap(map) {
  return Object.freeze(map);
}

export const WhitespaceStyleMap = createEnumMap({
  LINE_BREAK: "lineBreak",
});

function bind(fn, ...args) {
  return (...moreArgs) => fn(...args, ...moreArgs);
}

/**
 * @param {TestRunState} resultState
 * @param {TestRunHooks} hooks
 * @returns {InstructionDocument}
 */
export function instructionDocument(resultState, hooks) {
  const mode = resultState.info.mode;
  const modeInstructions = resultState.info.modeInstructions;
  const userInstructions = resultState.info.userInstructions;
  const lastInstruction = userInstructions[userInstructions.length - 1];
  const setupScriptDescription = resultState.info.setupScriptDescription
    ? ` and runs a script that ${resultState.info.setupScriptDescription}.`
    : resultState.info.setupScriptDescription;
  // As a hack, special case mode instructions for VoiceOver for macOS until we
  // support modeless tests. ToDo: remove this when resolving issue #194
  const modePhrase =
    resultState.config.at.name === "VoiceOver for macOS"
      ? "Describe "
      : `With ${resultState.config.at.name} in ${mode} mode, describe `;

  const commands = resultState.commands.map(({description}) => description);
  const assertions = resultState.commands[0].assertions.map(({description}) => description);
  const additionalAssertions = resultState.commands[0].additionalAssertions.map(({description}) => description);

  let firstRequired = true;
  function focusFirstRequired() {
    if (firstRequired) {
      firstRequired = false;
      return true;
    }
    return false;
  }

  return {
    errors: {
      visible: false,
      header: "",
      errors: [],
    },
    instructions: {
      header: {
        header: `Testing task: ${resultState.info.description}`,
        focus: resultState.currentUserAction === UserActionMap.LOAD_PAGE,
      },
      description: `${modePhrase} how ${resultState.config.at.name} behaves when performing task "${lastInstruction}"`,
      instructions: {
        header: "Test instructions",
        instructions: [
          [
            `Restore default settings for ${resultState.config.at.name}. For help, read `,
            {
              href: "https://github.com/w3c/aria-at/wiki/Configuring-Screen-Readers-for-Testing",
              description: "Configuring Screen Readers for Testing",
            },
            `.`,
          ],
          `Activate the "Open test page" button below, which opens the example to test in a new window${setupScriptDescription}`,
        ],
        strongInstructions: [modeInstructions, ...userInstructions],
        commands: {
          description: `Using the following commands, ${lastInstruction}`,
          commands,
        },
      },
      assertions: {
        header: "Success Criteria",
        description: `To pass this test, ${resultState.config.at.name} needs to meet all the following assertions when each  specified command is executed:`,
        assertions,
      },
      openTestPage: {
        button: "Open Test Page",
        enabled: resultState.openTest.enabled,
        click: hooks.openTestPage,
      },
    },
    results: {
      header: {
        header: "Record Results",
        description: `${resultState.info.description}`,
      },
      commands: commands.map(commandResult),
    },
    submit: resultState.config.displaySubmitButton
      ? {
          button: "Submit Results",
          click: hooks.submit,
        }
      : null,
  };

  /**
   * @param {T} resultAssertion
   * @param {T["result"]} resultValue
   * @param {Omit<InstructionDocumentAssertionChoice, 'checked' | 'focus'>} partialChoice
   * @returns {InstructionDocumentAssertionChoice}
   * @template {TestRunAssertion | TestRunAdditionalAssertion} T
   */
  function assertionChoice(resultAssertion, resultValue, partialChoice) {
    return {
      ...partialChoice,
      checked: resultAssertion.result === resultValue,
      focus:
        resultState.currentUserAction === "validateResults" &&
        resultAssertion.highlightRequired &&
        focusFirstRequired(),
    };
  }

  /**
   * @param {string} command
   * @param {number} commandIndex
   * @returns {InstructionDocumentResultsCommand}
   */
  function commandResult(command, commandIndex) {
    const resultStateCommand = resultState.commands[commandIndex];
    const resultUnexpectedBehavior = resultStateCommand.unexpected;
    return {
      header: `After '${command}'`,
      atOutput: {
        description: [
          `${resultState.config.at.name} output after ${command}`,
          {
            required: true,
            highlightRequired: resultStateCommand.atOutput.highlightRequired,
            description: "(required)",
          },
        ],
        value: resultStateCommand.atOutput.value,
        focus:
          resultState.currentUserAction === "validateResults" &&
          resultStateCommand.atOutput.highlightRequired &&
          focusFirstRequired(),
        change: atOutput => hooks.setCommandOutput({commandIndex, atOutput}),
      },
      assertionsHeader: {
        descriptionHeader: "",
        passHeader: "",
        failHeader: "",
      },
      assertions: [
        ...assertions.map(bind(assertionResult, commandIndex)),
        ...additionalAssertions.map(bind(additionalAssertionResult, commandIndex)),
      ],
      unexpectedBehaviors: {
        description: [
          "Were there additional undesirable behaviors?",
          {
            required: true,
            highlightRequired: resultStateCommand.unexpected.highlightRequired,
            description: "(required)",
          },
        ],
        passChoice: {
          label: "No, there were no additional undesirable behaviors.",
          checked: resultUnexpectedBehavior.hasUnexpected === HasUnexpectedBehaviorMap.DOES_NOT_HAVE_UNEXPECTED,
          focus:
            resultState.currentUserAction === "validateResults" &&
            resultUnexpectedBehavior.highlightRequired &&
            resultUnexpectedBehavior.hasUnexpected === HasUnexpectedBehaviorMap.NOT_SET &&
            focusFirstRequired(),
          click: () =>
            hooks.setCommandHasUnexpectedBehavior({
              commandIndex,
              hasUnexpected: HasUnexpectedBehaviorMap.DOES_NOT_HAVE_UNEXPECTED,
            }),
        },
        failChoice: {
          label: "Yes, there were additional undesirable behaviors",
          checked: resultUnexpectedBehavior.hasUnexpected === HasUnexpectedBehaviorMap.HAS_UNEXPECTED,
          focus:
            resultState.currentUserAction === "validateResults" &&
            resultUnexpectedBehavior.highlightRequired &&
            resultUnexpectedBehavior.hasUnexpected === HasUnexpectedBehaviorMap.NOT_SET &&
            focusFirstRequired(),
          click: () =>
            hooks.setCommandHasUnexpectedBehavior({
              commandIndex,
              hasUnexpected: HasUnexpectedBehaviorMap.HAS_UNEXPECTED,
            }),
          options: {
            header: "Undesirable behaviors",
            options: resultUnexpectedBehavior.behaviors.map((behavior, unexpectedIndex) => {
              return {
                description: behavior.description,
                enabled: resultUnexpectedBehavior.hasUnexpected === HasUnexpectedBehaviorMap.HAS_UNEXPECTED,
                tabbable: resultUnexpectedBehavior.tabbedBehavior === unexpectedIndex,
                checked: behavior.checked,
                focus:
                  typeof resultState.currentUserAction === "object" &&
                  resultState.currentUserAction.action === UserObjectActionMap.FOCUS_UNDESIRABLE
                    ? resultState.currentUserAction.commandIndex === commandIndex &&
                      resultUnexpectedBehavior.tabbedBehavior === unexpectedIndex
                    : resultState.currentUserAction === UserActionMap.VALIDATE_RESULTS &&
                      resultUnexpectedBehavior.hasUnexpected === HasUnexpectedBehaviorMap.HAS_UNEXPECTED &&
                      resultUnexpectedBehavior.behaviors.every(({checked}) => !checked) &&
                      focusFirstRequired(),
                change: checked => hooks.setCommandUnexpectedBehavior({commandIndex, unexpectedIndex, checked}),
                keydown: key => {
                  const increment = keyToFocusIncrement(key);
                  if (increment) {
                    hooks.focusCommandUnexpectedBehavior({commandIndex, unexpectedIndex, increment});
                    return true;
                  }
                  return false;
                },
                more: behavior.more
                  ? {
                      description: /** @type {Description[]} */ ([
                        `If "other" selected, explain`,
                        {
                          required: true,
                          highlightRequired: behavior.more.highlightRequired,
                          description: "(required)",
                        },
                      ]),
                      enabled: behavior.checked,
                      value: behavior.more.value,
                      focus:
                        resultState.currentUserAction === "validateResults" &&
                        behavior.more.highlightRequired &&
                        focusFirstRequired(),
                      change: value =>
                        hooks.setCommandUnexpectedBehaviorMore({commandIndex, unexpectedIndex, more: value}),
                    }
                  : null,
              };
            }),
          },
        },
      },
    };
  }

  /**
   * @param {number} commandIndex
   * @param {string} assertion
   * @param {number} assertionIndex
   */
  function assertionResult(commandIndex, assertion, assertionIndex) {
    const resultAssertion = resultState.commands[commandIndex].assertions[assertionIndex];
    return /** @type {InstructionDocumentResultsCommandsAssertion} */ ({
      description: [
        assertion,
        {
          required: true,
          highlightRequired: resultAssertion.highlightRequired,
          description: "(required: mark output)",
        },
      ],
      passChoice: assertionChoice(resultAssertion, CommonResultMap.PASS, {
        label: [
          `Good Output `,
          {
            offScreen: true,
            description: "for assertion",
          },
        ],
        click: () => hooks.setCommandAssertion({commandIndex, assertionIndex, result: CommonResultMap.PASS}),
      }),
      failChoices: [
        assertionChoice(resultAssertion, AssertionResultMap.FAIL_MISSING, {
          label: [
            `No Output `,
            {
              offScreen: true,
              description: "for assertion",
            },
          ],
          click: () =>
            hooks.setCommandAssertion({commandIndex, assertionIndex, result: AssertionResultMap.FAIL_MISSING}),
        }),
        assertionChoice(resultAssertion, AssertionResultMap.FAIL_INCORRECT, {
          label: [
            `Incorrect Output `,
            {
              offScreen: true,
              description: "for assertion",
            },
          ],
          click: () =>
            hooks.setCommandAssertion({commandIndex, assertionIndex, result: AssertionResultMap.FAIL_MISSING}),
        }),
      ],
    });
  }

  /**
   * @param {number} commandIndex
   * @param {string} assertion
   * @param {number} assertionIndex
   */
  function additionalAssertionResult(commandIndex, assertion, assertionIndex) {
    const resultAdditionalAssertion = resultState.commands[commandIndex].additionalAssertions[assertionIndex];
    return /** @type {InstructionDocumentResultsCommandsAssertion} */ ({
      description: [
        assertion,
        {
          required: true,
          highlightRequired: resultAdditionalAssertion.highlightRequired,
          description: "(required: mark support)",
        },
      ],
      passChoice: assertionChoice(resultAdditionalAssertion, AdditionalAssertionResultMap.PASS, {
        label: ["Good Support ", {offScreen: true, description: "for assertion"}],
        click: () =>
          hooks.setCommandAdditionalAssertion({
            commandIndex,
            additionalAssertionIndex: assertionIndex,
            result: AdditionalAssertionResultMap.PASS,
          }),
      }),
      failChoices: [
        assertionChoice(resultAdditionalAssertion, AdditionalAssertionResultMap.FAIL_SUPPORT, {
          label: ["No Support ", {offScreen: true, description: "for assertion"}],
          click: () =>
            hooks.setCommandAdditionalAssertion({
              commandIndex,
              additionalAssertionIndex: assertionIndex,
              result: AdditionalAssertionResultMap.FAIL_SUPPORT,
            }),
        }),
      ],
    });
  }
}

/**
 * @typedef {typeof UserActionMap[keyof typeof UserActionMap]} UserAction
 */

export const UserActionMap = createEnumMap({
  LOAD_PAGE: "loadPage",
  OPEN_TEST_WINDOW: "openTestWindow",
  CLOSE_TEST_WINDOW: "closeTestWindow",
  VALIDATE_RESULTS: "validateResults",
  CHANGE_TEXT: "changeText",
  CHANGE_SELECTION: "changeSelection",
  SHOW_RESULTS: "showResults",
});

/**
 * @typedef {typeof UserObjectActionMap[keyof typeof UserObjectActionMap]} UserObjectAction
 */

export const UserObjectActionMap = createEnumMap({
  FOCUS_UNDESIRABLE: "focusUndesirable",
});

/**
 * @typedef {UserAction | UserActionFocusUnexpected} TestRunUserAction
 */

/**
 * @typedef {EnumValues<typeof HasUnexpectedBehaviorMap>} HasUnexpectedBehavior
 */

export const HasUnexpectedBehaviorMap = createEnumMap({
  NOT_SET: "notSet",
  HAS_UNEXPECTED: "hasUnexpected",
  DOES_NOT_HAVE_UNEXPECTED: "doesNotHaveUnexpected",
});

export const CommonResultMap = createEnumMap({
  NOT_SET: "notSet",
  PASS: "pass",
});

/**
 * @typedef {EnumValues<typeof AdditionalAssertionResultMap>} AdditionalAssertionResult
 */

export const AdditionalAssertionResultMap = createEnumMap({
  ...CommonResultMap,
  FAIL_SUPPORT: "failSupport",
});

/**
 * @typedef {EnumValues<typeof AssertionResultMap>} AssertionResult
 */

export const AssertionResultMap = createEnumMap({
  ...CommonResultMap,
  FAIL_MISSING: "failMissing",
  FAIL_INCORRECT: "failIncorrect",
});

/**
 * @param {object} props
 * @param {number} props.commandIndex
 * @param {string} props.atOutput
 * @returns {(state: TestRunState) => TestRunState}
 */
export function userChangeCommandOutput({commandIndex, atOutput}) {
  return function (state) {
    return {
      ...state,
      currentUserAction: UserActionMap.CHANGE_TEXT,
      commands: state.commands.map((commandState, index) =>
        index !== commandIndex
          ? commandState
          : {
              ...commandState,
              atOutput: {
                ...commandState.atOutput,
                value: atOutput,
              },
            }
      ),
    };
  };
}

/**
 * @param {object} props
 * @param {number} props.commandIndex
 * @param {number} props.assertionIndex
 * @param {AssertionResult} props.result
 * @returns {(state: TestRunState) => TestRunState}
 */
export function userChangeCommandAssertion({commandIndex, assertionIndex, result}) {
  return function (state) {
    return {
      ...state,
      currentUserAction: UserActionMap.CHANGE_SELECTION,
      commands: state.commands.map((command, commandI) =>
        commandI !== commandIndex
          ? command
          : {
              ...command,
              assertions: command.assertions.map((assertion, assertionI) =>
                assertionI !== assertionIndex ? assertion : {...assertion, result}
              ),
            }
      ),
    };
  };
}

/**
 * @param {object} props
 * @param {number} props.commandIndex
 * @param {number} props.additionalAssertionIndex
 * @param {AdditionalAssertionResult} props.result
 * @returns {(state: TestRunState) => TestRunState}
 */
export function userChangeCommandAdditionalAssertion({commandIndex, additionalAssertionIndex, result}) {
  return function (state) {
    return {
      ...state,
      currentUserAction: UserActionMap.CHANGE_SELECTION,
      commands: state.commands.map((command, commandI) =>
        commandI !== commandIndex
          ? command
          : {
              ...command,
              additionalAssertions: command.additionalAssertions.map((assertion, assertionI) =>
                assertionI !== additionalAssertionIndex ? assertion : {...assertion, result}
              ),
            }
      ),
    };
  };
}

/**
 * @param {object} props
 * @param {number} props.commandIndex
 * @param {HasUnexpectedBehavior} props.hasUnexpected
 * @returns {(state: TestRunState) => TestRunState}
 */
export function userChangeCommandHasUnexpectedBehavior({commandIndex, hasUnexpected}) {
  return function (state) {
    return {
      ...state,
      currentUserAction: UserActionMap.CHANGE_SELECTION,
      commands: state.commands.map((command, commandI) =>
        commandI !== commandIndex
          ? command
          : {
              ...command,
              unexpected: {
                ...command.unexpected,
                hasUnexpected: hasUnexpected,
                tabbedBehavior: hasUnexpected === HasUnexpectedBehaviorMap.HAS_UNEXPECTED ? 0 : -1,
                behaviors: command.unexpected.behaviors.map(behavior => ({
                  ...behavior,
                  checked: false,
                  more: behavior.more ? {...behavior.more, value: ""} : null,
                })),
              },
            }
      ),
    };
  };
}

/**
 * @param {object} props
 * @param {number} props.commandIndex
 * @param {number} props.unexpectedIndex
 * @param {boolean} props.checked
 * @returns {(state: TestRunState) => TestRunState}
 */
export function userChangeCommandUnexpectedBehavior({commandIndex, unexpectedIndex, checked}) {
  return function (state) {
    return {
      ...state,
      currentUserAction: UserActionMap.CHANGE_SELECTION,
      commands: state.commands.map((command, commandI) =>
        commandI !== commandIndex
          ? command
          : {
              ...command,
              unexpected: {
                ...command.unexpected,
                behaviors: command.unexpected.behaviors.map((unexpected, unexpectedI) =>
                  unexpectedI !== unexpectedIndex
                    ? unexpected
                    : {
                        ...unexpected,
                        checked,
                      }
                ),
              },
            }
      ),
    };
  };
}

/**
 * @param {object} props
 * @param {number} props.commandIndex
 * @param {number} props.unexpectedIndex
 * @param {string} props.more
 * @returns {(state: TestRunState) => TestRunState}
 */
export function userChangeCommandUnexpectedBehaviorMore({commandIndex, unexpectedIndex, more}) {
  return function (state) {
    return {
      ...state,
      currentUserAction: UserActionMap.CHANGE_TEXT,
      commands: state.commands.map((command, commandI) =>
        commandI !== commandIndex
          ? command
          : /** @type {TestRunCommand} */ ({
              ...command,
              unexpected: {
                ...command.unexpected,
                behaviors: command.unexpected.behaviors.map((unexpected, unexpectedI) =>
                  unexpectedI !== unexpectedIndex
                    ? unexpected
                    : /** @type {TestRunUnexpectedBehavior} */ ({
                        ...unexpected,
                        more: {
                          ...unexpected.more,
                          value: more,
                        },
                      })
                ),
              },
            })
      ),
    };
  };
}

/**
 * @param {string} key
 * @returns {TestRunFocusIncrement}
 */
function keyToFocusIncrement(key) {
  switch (key) {
    case "Up":
    case "ArrowUp":
    case "Left":
    case "ArrowLeft":
      return "previous";

    case "Down":
    case "ArrowDown":
    case "Right":
    case "ArrowRight":
      return "next";
  }
}

/**
 * @param {TestRunState} state
 * @param {TestRunHooks} hooks
 * @returns {TestPageDocument}
 */
function testPageDocument(state, hooks) {
  if (state.currentUserAction === UserActionMap.SHOW_RESULTS) {
    return {
      results: resultsTableDocument(state),
    };
  }
  return {
    errors: null,
    instructions: instructionDocument(state, hooks),
  };
}

/**
 * @param {TestRun} app
 */
function submitResult(app) {
  app.dispatch(userValidateState());

  if (isSomeFieldRequired(app.state)) {
    return;
  }

  app.hooks.postResults();

  app.hooks.closeTestPage();

  if (app.state.config.renderResultsAfterSubmit) {
    app.dispatch(userShowResults());
  }
}

export function userShowResults() {
  return function (/** @type {TestRunState} */ state) {
    return /** @type {TestRunState} */ ({...state, currentUserAction: UserActionMap.SHOW_RESULTS});
  };
}

/**
 * @param {TestRunState} state
 * @returns
 */
function isSomeFieldRequired(state) {
  return state.commands.some(
    command =>
      command.atOutput.value.trim() === "" ||
      command.assertions.some(assertion => assertion.result === CommonResultMap.NOT_SET) ||
      command.additionalAssertions.some(assertion => assertion.result === CommonResultMap.NOT_SET) ||
      command.unexpected.hasUnexpected === HasUnexpectedBehaviorMap.NOT_SET ||
      (command.unexpected.hasUnexpected === HasUnexpectedBehaviorMap.HAS_UNEXPECTED &&
        (command.unexpected.behaviors.every(({checked}) => !checked) ||
          command.unexpected.behaviors.some(
            behavior => behavior.checked && behavior.more && behavior.more.value.trim() === ""
          )))
  );
}

/**
 * @param {TestRunState} state
 * @returns {ResultsTableDocument}
 */
function resultsTableDocument(state) {
  return {
    header: state.info.description,
    status: {
      header: [
        "Test result: ",
        state.commands.some(
          ({assertions, additionalAssertions, unexpected}) =>
            [...assertions, ...additionalAssertions].some(
              ({priority, result}) => priority === 1 && result !== CommonResultMap.PASS
            ) || unexpected.behaviors.some(({checked}) => checked)
        )
          ? "FAIL"
          : "PASS",
      ],
    },
    table: {
      headers: {
        description: "Command",
        support: "Support",
        details: "Details",
      },
      commands: state.commands.map(command => {
        const allAssertions = [...command.assertions, ...command.additionalAssertions];

        let passingAssertions = ["No passing assertions."];
        let failingAssertions = ["No failing assertions."];
        let unexpectedBehaviors = ["No unexpect behaviors."];

        if (allAssertions.some(({result}) => result === CommonResultMap.PASS)) {
          passingAssertions = allAssertions
            .filter(({result}) => result === CommonResultMap.PASS)
            .map(({description}) => description);
        }
        if (allAssertions.some(({result}) => result !== CommonResultMap.PASS)) {
          failingAssertions = allAssertions
            .filter(({result}) => result !== CommonResultMap.PASS)
            .map(({description}) => description);
        }
        if (command.unexpected.behaviors.some(({checked}) => checked)) {
          unexpectedBehaviors = command.unexpected.behaviors
            .filter(({checked}) => checked)
            .map(({description, more}) => (more ? more.value : description));
        }

        return {
          description: command.description,
          support:
            allAssertions.some(({priority, result}) => priority === 1 && result !== CommonResultMap.PASS) ||
            command.unexpected.behaviors.some(({checked}) => checked)
              ? "FAILING"
              : allAssertions.some(({priority, result}) => priority === 2 && result !== CommonResultMap.PASS)
              ? "ALL_REQUIRED"
              : "FULL",
          details: {
            output: /** @type {Description} */ [
              "output:",
              /** @type {DescriptionWhitespace} */ ({whitespace: WhitespaceStyleMap.LINE_BREAK}),
              " ",
              ...command.atOutput.value
                .split(/(\r\n|\r|\n)/g)
                .map(output =>
                  /\r\n|\r|\n/.test(output)
                    ? /** @type {DescriptionWhitespace} */ ({whitespace: WhitespaceStyleMap.LINE_BREAK})
                    : output
                ),
            ],
            passingAssertions: {
              description: "Passing Assertions:",
              items: passingAssertions,
            },
            failingAssertions: {
              description: "Failing Assertions:",
              items: failingAssertions,
            },
            unexpectedBehaviors: {
              description: "Unexpected Behavior",
              items: unexpectedBehaviors,
            },
          },
        };
      }),
    },
  };
}

export function userOpenWindow() {
  return (/** @type {TestRunState} */ state) =>
    /** @type {TestRunState} */ ({
      ...state,
      currentUserAction: UserActionMap.OPEN_TEST_WINDOW,
      openTest: {...state.openTest, enabled: false},
    });
}

export function userCloseWindow() {
  return (/** @type {TestRunState} */ state) =>
    /** @type {TestRunState} */ ({
      ...state,
      currentUserAction: UserActionMap.CLOSE_TEST_WINDOW,
      openTest: {...state.openTest, enabled: true},
    });
}

/**
 * @param {object} props
 * @param {number} props.commandIndex
 * @param {number} props.unexpectedIndex
 * @param {TestRunFocusIncrement} props.increment
 * @returns {(state: TestRunState) => TestRunState}
 */
export function userFocusCommandUnexpectedBehavior({commandIndex, unexpectedIndex, increment}) {
  return function (state) {
    const unexpectedLength = state.commands[commandIndex].unexpected.behaviors.length;
    const incrementValue = increment === "next" ? 1 : -1;
    const newUnexpectedIndex = (unexpectedIndex + incrementValue + unexpectedLength) % unexpectedLength;

    return {
      ...state,
      currentUserAction: {
        action: UserObjectActionMap.FOCUS_UNDESIRABLE,
        commandIndex,
        unexpectedIndex: newUnexpectedIndex,
      },
      commands: state.commands.map((command, commandI) => {
        const tabbed = command.unexpected.tabbedBehavior;
        const unexpectedLength = command.unexpected.behaviors.length;
        const newTabbed = (tabbed + (increment === "next" ? 1 : -1) + unexpectedLength) % unexpectedLength;
        return commandI !== commandIndex
          ? command
          : {
              ...command,
              unexpected: {
                ...command.unexpected,
                tabbedBehavior: newTabbed,
              },
            };
      }),
    };
  };
}

/**
 * @returns {(state: TestRunState) => TestRunState}
 */
export function userValidateState() {
  return function (state) {
    return {
      ...state,
      currentUserAction: UserActionMap.VALIDATE_RESULTS,
      commands: state.commands.map(command => {
        return {
          ...command,
          atOutput: {
            ...command.atOutput,
            highlightRequired: !command.atOutput.value.trim(),
          },
          assertions: command.assertions.map(assertion => ({
            ...assertion,
            highlightRequired: assertion.result === CommonResultMap.NOT_SET,
          })),
          additionalAssertions: command.additionalAssertions.map(assertion => ({
            ...assertion,
            highlightRequired: assertion.result === CommonResultMap.NOT_SET,
          })),
          unexpected: {
            ...command.unexpected,
            highlightRequired:
              command.unexpected.hasUnexpected === HasUnexpectedBehaviorMap.NOT_SET ||
              (command.unexpected.hasUnexpected === HasUnexpectedBehaviorMap.HAS_UNEXPECTED &&
                command.unexpected.behaviors.every(({checked}) => !checked)),
            behaviors: command.unexpected.behaviors.map(unexpected => {
              return unexpected.more
                ? {
                    ...unexpected,
                    more: {
                      ...unexpected.more,
                      highlightRequired: unexpected.checked && !unexpected.more.value.trim(),
                    },
                  }
                : unexpected;
            }),
          },
        };
      }),
    };
  };
}

/**
 * @typedef AT
 * @property {string} name
 * @property {string} key
 */

/**
 * @typedef Behavior
 * @property {string} description
 * @property {string} task
 * @property {string} mode
 * @property {string} modeInstructions
 * @property {string[]} appliesTo
 * @property {string} specificUserInstruction
 * @property {string} setupScriptDescription
 * @property {string} setupTestPage
 * @property {string[]} commands
 * @property {[string, string][]} outputAssertions
 * @property {[number, string][]} additionalAssertions
 */

/**
 * @typedef {"previous" | "next"} TestRunFocusIncrement
 */

/**
 * @typedef {(action: (state: TestRunState) => TestRunState) => void} Dispatcher
 */

/**
 * @typedef InstructionDocumentButton
 * @property {Description} button
 * @property {boolean} [enabled]
 * @property {() => void} click
 */

/**
 * @typedef InstructionDocumentAssertionChoiceOptionsOptionsMore
 * @property {Description} description
 * @property {string} value
 * @property {boolean} enabled
 * @property {boolean} [focus]
 * @property {(value: string) => void} change
 */

/**
 * @typedef InstructionDocumentAssertionChoiceOptionsOption
 * @property {Description} description
 * @property {boolean} checked
 * @property {boolean} enabled
 * @property {boolean} tabbable
 * @property {boolean} [focus]
 * @property {(checked: boolean) => void} change
 * @property {(key: string) => boolean} keydown
 * @property {InstructionDocumentAssertionChoiceOptionsOptionsMore} [more]
 */

/**
 * @typedef InstructionDocumentAssertionChoiceOptions
 * @property {Description} header
 * @property {InstructionDocumentAssertionChoiceOptionsOption[]} options
 */

/**
 * @typedef InstructionDocumentAssertionChoice
 * @property {Description} label
 * @property {boolean} checked
 * @property {boolean} [focus]
 * @property {() => void} click
 * @property {InstructionDocumentAssertionChoiceOptions} [options]
 */

/**
 * @typedef DescriptionRich
 * @property {string} [href]
 * @property {boolean} [required]
 * @property {boolean} [highlightRequired]
 * @property {boolean} [offScreen]
 * @property {Description} description
 */

/**
 * @typedef DescriptionWhitespace
 * @property {typeof WhitespaceStyleMap["LINE_BREAK"]} whitespace
 */

/** @typedef {string | DescriptionRich | DescriptionWhitespace | DescriptionArray} Description */

/** @typedef {Description[]} DescriptionArray */

/**
 * @typedef InstructionDocumentResultsCommandsAssertion
 * @property {Description} description
 * @property {InstructionDocumentAssertionChoice} passChoice
 * @property {InstructionDocumentAssertionChoice[]} failChoices
 */

/**
 * @typedef InstructionDocumentResultsCommandsAssertionsHeader
 * @property {Description} descriptionHeader
 * @property {Description} passHeader
 * @property {Description} failHeader
 */

/**
 * @typedef InstructionDocumentResultsCommandsATOutput
 * @property {Description} description
 * @property {string} value
 * @property {boolean} focus
 * @property {(value: string) => void} change
 */

/**
 * @typedef InstructionDocumentResultsCommandsUnexpected
 * @property {Description} description
 * @property {InstructionDocumentAssertionChoice} passChoice
 * @property {InstructionDocumentAssertionChoice} failChoice
 */

/**
 * @typedef InstructionDocumentResultsCommand
 * @property {Description} header
 * @property {InstructionDocumentResultsCommandsATOutput} atOutput
 * @property {InstructionDocumentResultsCommandsAssertionsHeader} assertionsHeader
 * @property {InstructionDocumentResultsCommandsAssertion[]} assertions
 * @property {InstructionDocumentResultsCommandsUnexpected} unexpectedBehaviors
 */

/**
 * @typedef InstructionDocumentResultsHeader
 * @property {Description} header
 * @property {Description} description
 */

/**
 * @typedef InstructionDocumentResults
 * @property {InstructionDocumentResultsHeader} header
 * @property {InstructionDocumentResultsCommand[]} commands
 */

/**
 * @typedef InstructionDocumentInstructionsInstructionsCommands
 * @property {Description} description
 * @property {Description[]} commands
 */

/**
 * @typedef InstructionDocumentInstructionsInstructions
 * @property {Description} header
 * @property {Description[]} instructions
 * @property {Description[]} strongInstructions
 * @property {InstructionDocumentInstructionsInstructionsCommands} commands
 */

/**
 * @typedef InstructionDocumentErrors
 * @property {boolean} visible
 * @property {Description} header
 * @property {Description[]} errors
 */

/**
 * @typedef InstructionDocumentInstructionsHeader
 * @property {Description} header
 * @property {boolean} focus
 */

/**
 * @typedef InstructionDocumentInstructionsAssertions
 * @property {Description} header
 * @property {Description} description
 * @property {Description[]} assertions
 */

/**
 * @typedef InstructionDocumentInstructions
 * @property {InstructionDocumentInstructionsHeader} header
 * @property {Description} description
 * @property {InstructionDocumentInstructionsInstructions} instructions
 * @property {InstructionDocumentInstructionsAssertions} assertions
 * @property {InstructionDocumentButton} openTestPage
 */

/**
 * @typedef InstructionDocument
 * @property {InstructionDocumentErrors} errors
 * @property {InstructionDocumentInstructions} instructions
 * @property {InstructionDocumentResults} results
 * @property {InstructionDocumentButton} submit
 */

/**
 * @typedef TestRunHooks
 * @property {() => void} closeTestPage
 * @property {(options: {commandIndex: number, unexpectedIndex: number, increment: TestRunFocusIncrement}) => void} focusCommandUnexpectedBehavior
 * @property {() => void} openTestPage
 * @property {() => void} postResults
 * @property {(options: {commandIndex: number, additionalAssertionIndex: number, result: AdditionalAssertionResult}) => void} setCommandAdditionalAssertion
 * @property {(options: {commandIndex: number, assertionIndex: number, result: AssertionResult}) => void} setCommandAssertion
 * @property {(options: {commandIndex: number, hasUnexpected: HasUnexpectedBehavior}) => void } setCommandHasUnexpectedBehavior
 * @property {(options: {commandIndex: number, atOutput: string}) => void} setCommandOutput
 * @property {(options: {commandIndex: number, unexpectedIndex: number, checked}) => void } setCommandUnexpectedBehavior
 * @property {(options: {commandIndex: number, unexpectedIndex: number, more: string}) => void } setCommandUnexpectedBehaviorMore
 * @property {() => void} submit
 */

/**
 * @typedef UserActionFocusUnexpected
 * @property {typeof UserObjectActionMap["FOCUS_UNDESIRABLE"]} action
 * @property {number} commandIndex
 * @property {number} unexpectedIndex
 */

/**
 * @typedef {T[keyof T]} EnumValues
 * @template {{[key: string]: string}} T
 */

/**
 * @typedef TestRunAssertion
 * @property {string} description
 * @property {boolean} highlightRequired
 * @property {number} priority
 * @property {AssertionResult} result
 */

/**
 * @typedef TestRunAdditionalAssertion
 * @property {string} description
 * @property {boolean} highlightRequired
 * @property {number} priority
 * @property {AdditionalAssertionResult} result
 */

/**
 * @typedef TestRunUnexpectedBehavior
 * @property {string} description
 * @property {boolean} checked
 * @property {object} [more]
 * @property {boolean} more.highlightRequired
 * @property {string} more.value
 */

/**
 * @typedef TestRunUnexpectedGroup
 * @property {boolean} highlightRequired
 * @property {HasUnexpectedBehavior} hasUnexpected
 * @property {number} tabbedBehavior
 * @property {TestRunUnexpectedBehavior[]} behaviors
 */

/**
 * @typedef TestRunCommand
 * @property {string} description
 * @property {object} atOutput
 * @property {boolean} atOutput.highlightRequired
 * @property {string} atOutput.value
 * @property {TestRunAssertion[]} assertions
 * @property {TestRunAdditionalAssertion[]} additionalAssertions
 * @property {TestRunUnexpectedGroup} unexpected
 */

/**
 * @typedef TestRunState
 * This state contains all the serializable values that are needed to render any
 * of the documents (InstructionDocument, ResultsTableDocument, and
 * TestPageDocument) from this module.
 *
 * @property {string[] | null} errors
 * @property {object} info
 * @property {string} info.description
 * @property {string} info.task
 * @property {ATMode} info.mode
 * @property {string} info.modeInstructions
 * @property {string[]} info.userInstructions
 * @property {string} info.setupScriptDescription
 * @property {object} config
 * @property {AT} config.at
 * @property {boolean} config.renderResultsAfterSubmit
 * @property {boolean} config.displaySubmitButton
 * @property {TestRunUserAction} currentUserAction
 * @property {TestRunCommand[]} commands
 * @property {object} openTest
 * @property {boolean} openTest.enabled
 */

/**
 * @typedef ResultsTableDetailsList
 * @property {Description} description
 * @property {Description[]} items
 */

/**
 * @typedef ResultsTableDocument
 * @property {string} header
 * @property {object} status
 * @property {Description} status.header
 * @property {object} table
 * @property {object} table.headers
 * @property {string} table.headers.description
 * @property {string} table.headers.support
 * @property {string} table.headers.details
 * @property {object[]} table.commands
 * @property {string} table.commands[].description
 * @property {Description} table.commands[].support
 * @property {object} table.commands[].details
 * @property {Description} table.commands[].details.output
 * @property {ResultsTableDetailsList} table.commands[].details.passingAssertions
 * @property {ResultsTableDetailsList} table.commands[].details.failingAssertions
 * @property {ResultsTableDetailsList} table.commands[].details.unexpectedBehaviors
 */

/**
 * @typedef TestPageDocumentResults
 * @property {ResultsTableDocument} results
 */

/**
 * @typedef TestPageDocumentInstructions
 * @property {string[] | null} errors
 * @property {InstructionDocument} instructions
 */

/** @typedef {TestPageDocumentInstructions | TestPageDocumentResults} TestPageDocument */

/** @typedef {"reading" | "interaction"} ATMode */
