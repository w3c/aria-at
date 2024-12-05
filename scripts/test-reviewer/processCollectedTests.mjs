import { unescapeHTML } from './utils.mjs';

/**
 * @param {CollectedTest} collectedTest
 * @param {commandsAPI} commandsAPI
 * @param {string} atKey
 * @param {string} mode
 * @param {string} task
 * @param {number} testNumber
 * @returns {{defaultConfigurationInstructions, assertionsForCommandsInstructions, at, modeInstructions, userInstruction, commandsValuesForInstructions}}
 */
const processCollectedTests = ({ collectedTest, commandsAPI, atKey, mode, task, testNumber }) => {
  let assertionsInstructions,
    assertionsForCommandsInstructions,
    commandsValuesForInstructions,
    modeInstructions = undefined;

  // TODO: Standardize naming on settings instead of outdated 'mode'
  let additionalSettings = [];

  /** @type {CollectedTestAT} */
  const at = commandsAPI.isKnownAT(atKey);
  const defaultConfigurationInstructions = unescapeHTML(
    commandsAPI.defaultConfigurationInstructions(atKey)
  );

  if (collectedTest.additional_assertions && collectedTest.additional_assertions[at.key]) {
    assertionsInstructions = collectedTest.additional_assertions[at.key];
  } else {
    assertionsInstructions = collectedTest.output_assertions;
  }

  const defaultAssertionsInstructions =
    assertionsInstructions && assertionsInstructions.length
      ? assertionsInstructions.map(a => {
          // V1 support
          if (Array.isArray(a)) {
            return {
              assertionId: null,
              priority: getPriorityString(a[0]),
              assertionPhrase: 'N/A',
              assertionStatement: a[1],
            };
          }

          // V2 support
          return {
            assertionId: a.assertionId,
            priority: getPriorityString(a.priority),
            assertionPhrase: a.tokenizedAssertionPhrases?.[at.key] || a.assertionPhrase,
            assertionStatement: a.tokenizedAssertionStatements?.[at.key] || a.assertionStatement,
          };
        })
      : undefined;

  function findCommandInfo(assertionForCommand) {
    return collectedTest.commandsInfo?.[at.key]?.find(
      c =>
        c.command === assertionForCommand.key &&
        c.settings === assertionForCommand.settings &&
        c.presentationNumber === assertionForCommand.presentationNumber
    );
  }

  /**
   * Check default assertion priorities to verify if there is a priority exception and return the
   * updated list of assertions
   *
   * @param assertionForCommand
   * @returns {*[]}
   */
  function getAssertionWithUpdatedPriority(assertionForCommand) {
    return defaultAssertionsInstructions.map(assertion => {
      let priority = assertion.priority;

      // Check to see if there is any command info exceptions for current at key
      const foundCommandInfo = collectedTest.commandsInfo?.[at.key]?.find(
        c =>
          c.command === assertionForCommand.key &&
          c.settings === assertionForCommand.settings &&
          c.presentationNumber === assertionForCommand.presentationNumber &&
          c.assertionExceptions.includes(assertion.assertionId)
      );

      if (foundCommandInfo) {
        for (const exceptionPair of foundCommandInfo.assertionExceptions.split(' ')) {
          let [exceptionPriority, exceptionAssertion] = exceptionPair.split(':');
          exceptionPriority = Number(exceptionPriority);

          if (assertion.assertionId === exceptionAssertion) {
            priority = getPriorityString(exceptionPriority);
          }
        }
      }

      return {
        ...assertion,
        priority,
      };
    });
  }

  try {
    assertionsForCommandsInstructions = commandsAPI.getATCommands(mode, task, {
      ...at,
      settings: {
        ...at.settings,
        defaultMode: {
          // TODO: If there is a need to explicitly state that the
          //  default mode is active for an AT
          screenText: '',
          // instructions: [at.defaultConfigurationInstructionsHTML],
        },
      },
    });

    if (
      assertionsForCommandsInstructions.length &&
      typeof assertionsForCommandsInstructions[0] === 'object'
    ) {
      // Check for additional settings
      const foundCommandInfos = assertionsForCommandsInstructions.map(findCommandInfo);
      assertionsForCommandsInstructions = assertionsForCommandsInstructions.map(
        (assertionForCommand, index) => {
          const foundCommandInfo = foundCommandInfos[index];

          const additionalSettingsExpanded = [];
          for (const additionalSetting of foundCommandInfo.additionalSettings) {
            if (!additionalSettings.includes(additionalSetting))
              additionalSettings.push(additionalSetting);

            const expandedSettings = {
              settings: additionalSetting,
              settingsText: at.settings[additionalSetting].screenText,
            };

            // Update value text if additional settings exist
            assertionForCommand.value =
              assertionForCommand.value.slice(0, -1) + ` and ${expandedSettings.settingsText})`;

            additionalSettingsExpanded.push(expandedSettings);
          }

          return {
            ...assertionForCommand,
            additionalSettingsExpanded,
            additionalSettings: foundCommandInfo.additionalSettings,
          };
        }
      );
      commandsValuesForInstructions = assertionsForCommandsInstructions.map(each => each.value);
    } else {
      // V1 came in as array of strings
      if (assertionsForCommandsInstructions.every(each => typeof each === 'string')) {
        commandsValuesForInstructions = assertionsForCommandsInstructions;
        assertionsForCommandsInstructions = assertionsForCommandsInstructions.map(each => ({
          value: each,
        }));
      }
    }

    // For V2 to handle assertion exceptions
    assertionsForCommandsInstructions = assertionsForCommandsInstructions.map(
      (assertionForCommand, assertionForCommandIndex) => {
        const assertionsInstructions = getAssertionWithUpdatedPriority(assertionForCommand);

        return {
          ...assertionForCommand,
          assertionsInstructions,
          elemId: `t${testNumber}-${at.key}-c${assertionForCommandIndex + 1}`,
          mustCount: assertionsInstructions.reduce(
            (acc, curr) => acc + (curr.priority === 'MUST' ? 1 : 0),
            0
          ),
          shouldCount: assertionsInstructions.reduce(
            (acc, curr) => acc + (curr.priority === 'SHOULD' ? 1 : 0),
            0
          ),
          mayCount: assertionsInstructions.reduce(
            (acc, curr) => acc + (curr.priority === 'MAY' ? 1 : 0),
            0
          ),
        };
      }
    );

    if (commandsValuesForInstructions && !commandsValuesForInstructions.length) {
      // Invalid state to reflect that no commands have been added to the related .csv in the template
      commandsValuesForInstructions = undefined;
    }
  } catch (error) {
    // An error will occur if there is no data for an AT, ignore it
  }

  // Create unique set
  const foundAtModes = [...new Set([...mode.split('_'), ...additionalSettings])];
  for (const atMode of foundAtModes) {
    // TODO: If there is ever need to explicitly show the instructions
    //  for an AT with the default mode active
    // const atSettingsWithDefault = {
    //   ...at.settings,
    //   defaultMode: {
    //     screenText: 'default mode active',
    //     instructions: [at.defaultConfigurationInstructionsHTML],
    //   },
    // };

    if (at.settings[atMode]) {
      let settings = at.settings[atMode];
      const modifiedSettings = {
        ...settings,
        screenText:
          collectedTest.testPlanStrings.settingInstructionsPreface +
          ' ' +
          settings.screenText +
          ':',
        instructions: settings.instructions.map(instruction => {
          return unescapeHTML(instruction);
        }),
      };
      if (!modeInstructions) modeInstructions = [modifiedSettings];
      else modeInstructions = [...modeInstructions, modifiedSettings];
    }
  }

  // Append commandListSettingsPreface only if 1+ command exists that specifies a setting
  let userInstruction =
    collectedTest.specific_user_instruction +
    ' ' +
    collectedTest.testPlanStrings.commandListPreface;

  if (modeInstructions)
    userInstruction =
      userInstruction + ' ' + collectedTest.testPlanStrings.commandListSettingsPreface;

  return {
    at,
    userInstruction,
    modeInstructions,
    commandsValuesForInstructions,
    defaultConfigurationInstructions,
    assertionsForCommandsInstructions,
  };
};

const getPriorityString = function (priority) {
  priority = parseInt(priority);
  if (priority === 1) {
    return 'MUST';
  } else if (priority === 2) {
    return 'SHOULD';
  } else if (priority === 3) {
    return 'MAY';
  }
  return '';
};

export default processCollectedTests;

/**
 * @typedef OutputAssertionsV2
 * @property {string} assertionId
 * @property {number} priority
 * @property {string} assertionStatement
 * @property {string} assertionPhrase
 * @property {string} refIds
 * @property {Object<key, string>} tokenizedAssertionStatements
 * @property {Object<key, string>} tokenizedAssertionPhrases
 */

/**
 * @typedef CommandInfo
 * @property {string} testId
 * @property {string} command
 * @property {string} settings
 * @property {number} presentationNumber
 * @property {string} assertionExceptions
 */

/**
 * @typedef CollectedTest
 * @property {string} setup_script_description
 * @property {string} setupTestPage
 * @property {string[]} applies_to
 * @property {string} mode
 * @property {string} task
 * @property {Object<key, CommandInfo[]>} commandsInfo
 * @property {Object} testPlanStrings
 * @property {string} testPlanStrings.ariaSpecsPreface
 * @property {string} testPlanStrings.openExampleInstruction
 * @property {string} testPlanStrings.commandListPreface
 * @property {string} testPlanStrings.commandListSettingsPreface
 * @property {string} testPlanStrings.settingInstructionsPreface
 * @property {string} testPlanStrings.assertionResponseQuestion
 * @property {string} specific_user_instruction
 * @property {[string, string][] | OutputAssertionsV2[]} output_assertions
 * @property {Object<string, AriaATFile.StringNumber[][]>} additional_assertions
 */

/**
 * @typedef CollectedTestAT
 * @property {string} key
 * @property {string} name
 * @property {string} defaultConfigurationInstructionsHTML
 * @property {Object} settings
 * @property {Object} assertionTokens
 */
