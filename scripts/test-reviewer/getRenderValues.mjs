import getReferenceForDirectory from './getReferenceForDirectory.mjs';

/**
 * @param {string} pattern
 * @param {ReviewRender.Test[]} tests
 * @param {AriaATCSV.Reference[]} references
 * @param {ReviewRender.AtOption[]} atOptions
 * @param {string[]} setupScripts
 * @returns {{title: string, pattern: string, h1Heading: string, tests: ReviewRender.Test[], atOptions: ReviewRender.AtOption[], setupScripts: string[], supportingDocs: Object<link: string, text: string>[]}}
 */
const getRenderValues = ({ pattern, tests, references, atOptions, setupScripts }) => {
  const supportingDocs = [];

  const { value: title } = getReferenceForDirectory(references, 'title');
  const { value: exampleLink, linkText: exampleLinkText } = getReferenceForDirectory(
    references,
    'example'
  );
  const { value: designPatternLink, linkText: designPatternLinkText } = getReferenceForDirectory(
    references,
    'designPattern'
  );
  const { value: developmentDocumentationLink, linkText: developmentDocumentationLinkText } =
    getReferenceForDirectory(references, 'developmentDocumentation');

  // Handle special cases where text could be null
  let defaultExampleLinkText;
  let defaultDesignPatternLinkText;

  if (exampleLink) {
    defaultExampleLinkText = `APG example: ${exampleLink.split('examples/')[1]}`;
  }
  if (designPatternLink) {
    defaultDesignPatternLinkText = `ARIA specification: ${designPatternLink.split('#')[1]}`;
  }

  if (exampleLink)
    supportingDocs.push({ link: exampleLink, text: exampleLinkText || defaultExampleLinkText });
  if (designPatternLink)
    supportingDocs.push({
      link: designPatternLink,
      text: designPatternLinkText || defaultDesignPatternLinkText,
    });
  if (developmentDocumentationLink)
    supportingDocs.push({
      link: developmentDocumentationLink,
      text: developmentDocumentationLinkText,
    });

  const testsLength = tests.length;
  const h1Heading = `${title} Test Plan (${tests.length} test${testsLength === 1 ? '' : 's'})`;

  return {
    title,
    pattern,
    h1Heading,
    tests,
    atOptions,
    setupScripts,
    supportingDocs,
  };
};

export default getRenderValues;

/**
 * @namespace ReviewRender
 */

/**
 * @typedef ReviewRender.Test
 * @property {number} testNumber - The unique identifier for the test
 * @property {string} title - The title of the test
 * @property {string} name - A brief name or description of the test
 * @property {string} location - The URL path to the HTML page where the test can be performed
 * @property {string} reference - The URL path to the reference documentation for the test
 * @property {string} allRelevantATsFormatted - A formatted string listing all relevant assistive technologies (ATs) for the test
 * @property {string} allRelevantATsSpaceSeparated - A space-separated string listing all relevant ATs
 * @property {ReviewRender.RelevantAT[]} allRelevantATs - An array of objects representing relevant assistive technologies
 * @property {string} setupScriptName - The name of the setup script used for the test
 * @property {string} task - The specific task being tested (or testId in v2)
 * @property {string} mode - The mode in which the test should be performed (additional but individual modes are connected together with '_', eg. mode1_mode2)
 * @property {ReviewRender.AtTest[]} atTests - An array of objects representing tests
 * @property {ReviewRender.HelpLink[]} helpLinks - An array of objects representing help links related to the test
 * @property {string} helpLinksTitle - The title for the help links section
 * @property {boolean} helpLinksExist - Indicates whether help links are available
 * @property {string} lastEdited - The date and time when the test was last edited
 * @property {boolean} isV2 - Indicates if this is a version 2 test
 */

/**
 * @typedef ReviewRender.RelevantAT
 * @property {string} key
 * @property {string} name
 */

/**
 * @typedef ReviewRender.AtTest
 * @property {string} atName
 * @property {string} atKey
 * @property {string[]} commandsValuesForInstructions
 * @property {ReviewRender.AssertionForCommandInstruction[]} assertionsForCommandsInstructions
 * @property {string} defaultConfigurationInstructions
 * @property {string} openExampleInstructions
 * @property {ReviewRender.ModeInstructions} modeInstructions
 * @property {string} userInstruction
 */

/**
 * @typedef ReviewRender.AssertionForCommandInstruction
 * @property {string} value
 * @property {string} key
 * @property {string} settings
 * @property {string} value
 * @property {ReviewRender.AssertionInstruction[]} assertionsInstructions
 * @property {string} elemId
 * @property {number} mustCount
 * @property {number} shouldCount
 * @property {number} mayCount
 */

/**
 * @typedef ReviewRender.AssertionInstruction
 * @property {string} assertionId
 * @property {'MUST' | 'SHOULD' | 'MAY'} priority
 * @property {string} assertionPhrase
 * @property {string} assertionStatement
 */

/**
 * @typedef ReviewRender.ModeInstructions
 * @property {string} screenText
 * @property {string[]} instructions
 */

/**
 * @typedef ReviewRender.HelpLink
 * @property {string} url
 * @property {string} string
 */

/**
 * @typedef ReviewRender.AtOption
 * @property {string} name
 * @property {string} key
 * @property {string} defaultConfigurationInstructionsHTML
 * @property {ReviewRender.AssertionToken} assertionTokens
 * @property {Object<key, ReviewRender.AtSetting>} settings
 */

/**
 * @typedef ReviewRender.AssertionToken
 * @property {string} screenReader
 * @property {string} readingMode
 * @property {string} readingCursor
 * @property {string} interactionMode
 */

/**
 * @typedef ReviewRender.AtSetting
 * @property {string} screenText
 * @property {string[]} instructions
 */
