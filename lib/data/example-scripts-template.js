/// <reference path="../util/file-record-types.js" />

'use strict';

const { validate, invariant } = require('../util/error');
const { reindent } = require('../util/lines');

const SCRIPTS_HEAD_MARKER = 'marker7dfe2e54ee48e64f02dbb8f1ce4f3878';
const SCRIPTS_CONTENT_MARKER = 'marker255b3ead39a8eac8bf74ec15235bcd27';

/**
 * @param {FileRecord.Record} exampleRecord
 * @returns {{render: function({script: string, button: string}): string}}
 */
function createExampleScriptsTemplate(exampleRecord) {
  const source = exampleRecord.text;

  const scriptsHeadMarkerTag = `<${SCRIPTS_HEAD_MARKER}></${SCRIPTS_HEAD_MARKER}>`;
  const scriptsContentMarkerTag = `<${SCRIPTS_CONTENT_MARKER}></${SCRIPTS_CONTENT_MARKER}>`;

  let replacedHead = false;
  let replacedMain = false;
  let foundBody = false;
  const modifiedSource = source.replace(/<\/\s*(head|main|body)\s*>/g, (match, tag) => {
    switch (tag) {
      case 'head':
        replacedHead = true;
        return `${scriptsHeadMarkerTag}${match}`;
      case 'main':
        replacedMain = true;
        return `${scriptsContentMarkerTag}${match}`;
      case 'body':
        foundBody = true;
        if (replacedMain) {
          return match;
        }
        return `${scriptsContentMarkerTag}${match}`;
      default:
        throw new Error(`unexpected closing tag: ${tag}`);
    }
  });

  invariant(replacedHead, `Example html does not have a 'head' element.`);
  validate(replacedMain, `Example html does not have a 'main' element. Using 'body' instead.`);
  invariant(foundBody, `Example html does not have a 'body' element.`);

  const modifiedSourceSplit = modifiedSource.split(
    new RegExp(`${scriptsHeadMarkerTag}|${scriptsContentMarkerTag}`, 'g')
  );
  // console.log(modifiedSourceSplit);

  return {
    /**
     * @param {object} param0
     * @param {string} param0.script
     * @param {string} param0.button
     */
    render({ script, button }) {
      return reindent(modifiedSourceSplit, script, button);
    },
  };
}

exports.createExampleScriptsTemplate = createExampleScriptsTemplate;
