/// <reference path="../../../types/aria-at-file.js" />

'use strict';

const { reindent } = require('../../util/lines');

/**
 * @param {AriaATFile.CollectedTest} test
 * @returns {string}
 */
function renderHTML(test, testFileName) {
  return reindent`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <title>${test.info.title}</title>
    ${test.info.references.map(({ value }) => `<link rel="help" href="${value}">`).join('\n')}
    <link rel="preload" href="${testFileName}" as="fetch">
    <style>
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

      div.problem-option-container.enabled {
        margin-bottom: 0.5em;
      }

      div.problem-option-container:last-child {
        margin-bottom: 0;
      }

      fieldset.assertions {
        margin-bottom: 1em;
      }

      label.assertion {
        display: block;
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
    </style>
  </head>
  <body>
    <script type="module">
      import {loadCollectedTestAsync} from "../../resources/aria-at-harness.mjs";
      loadCollectedTestAsync(new URL(location + "/..").pathname, "${testFileName}");
    </script>
  </body>
</html>
`;
}

exports.renderHTML = renderHTML;
