import {commandsAPI} from './at-commands.mjs';

const UNDESIRABLES = [
  "Output is excessively verbose, e.g., includes redundant and/or irrelevant speech",
  "Reading cursor position changed in an unexpected manner",
  "Screen reader became extremely sluggish",
  "Screen reader crashed",
  "Browser crashed"
];

const TEST_HTML_OUTLINE = `
<div>
  <section id='errors' style='display:none'><h2>Test cannot be performed due to error(s)!</h2><ul></ul><hr></section>
  <section id='instructions'></section>
  <section id='record-results'></section>
</div>
`;
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

let behavior;
let behaviorResults;
let overallStatus;
const errors = [];
let testPageUri;
/** @type {Window} */
let testPageWindow;
let showResults = true;
let showSubmitButton = true;

let at;
let commandsData;
let commapi;
let support;

export function initialize(newSupport, newCommandsData) {
  support = newSupport;
  commandsData = newCommandsData;
  commapi = new commandsAPI(commandsData, support);

  // Get the AT under test from the URL search params
  // set the showResults flag from the URL search params
  let params = (new URL(document.location)).searchParams;
  at = support.ats[0];
  for (const [key, value] of params) {
    if (key === 'at') {
      let requestedAT = value;
      if (commapi.isKnownAT(requestedAT)) {
        at = commapi.isKnownAT(requestedAT);
      }
      else {
        errors.push(`Harness does not have commands for the requested assistive technology ('${requestedAT}'), showing commands for assistive technology '${at.name}' instead. To test '${requestedAT}', please contribute command mappings to this project.`);
      }
    }
    if (key === 'showResults') {
      if (value === 'true') {
        showResults = true;
      } else if (value === 'false') {
        showResults = false;
      }
    }
    if (key === 'showSubmitButton') {
      if (value === 'true') {
        showSubmitButton = true;
      } else if (value === 'false') {
        showSubmitButton = false;
      }
    }
  }
}

function openTestPagePopup() {
  testPageWindow = window.open(testPageUri, '_blank', 'toolbar=0,location=0,menubar=0,width=400,height=400');

  document.getElementById('open-test-page').disabled = true;

  executeScriptInTestPage();
}

function putTestPageWindowIntoCorrectState() {
  // testPageWindow.location.reload(); // TODO: Address the race condition this causes with script execution.
  executeScriptInTestPage();
}

function executeScriptInTestPage() {
  if (!testPageWindow.onbeforeunload) {
    // If the window is closed, re-enable open popup button
    testPageWindow.onbeforeunload = function(event) {
      window.setTimeout(() => {
        if (testPageWindow.closed) {
          testPageWindow = undefined;
          document.getElementById('open-test-page').disabled = false;
        } else {
          // If the window is open (after a location.reload()) rerun the
          // setupTestPage script.
          executeScriptInTestPage();
        }
      }, 100);
    };
  }

  if (testPageWindow.location.origin !== window.location.origin // make sure the origin is the same, and prevent this from firing on an 'about' page
    || testPageWindow.document.readyState !== 'complete'
  ) {
    window.setTimeout(() => {
      executeScriptInTestPage();
    }, 100);
    return;
  }

  const buttonDiv = testPageWindow.document.createElement('div');
  buttonDiv.innerHTML = `
    <div style="position: relative; left: 0; right: 0; height: 2rem;">
      <button style="height: 100%; width: 100%;">Run Test Setup</button>
    </div>
  `;
  const button = buttonDiv.querySelector('button');

  /** @type {'setup' | 'reload'} */
  let runSetupOrRelad = 'setup';

  button.onclick = function() {
    try {
      if (runSetupOrRelad === 'setup') {
        runSetupOrRelad = 'reload';
        button.innerText = 'Reload Test';

        let setupTestPage = behavior.setupTestPage;
        if (setupTestPage) {
          scripts[behavior.setupTestPage](testPageWindow.document);
        }
      } else {
        testPageWindow.location.reload();
        button.disabled = true;
      }
    } catch (error) {
      window.console.error(error);
      throw error;
    }
  };

  testPageWindow.document.body.insertBefore(buttonDiv.children[0], testPageWindow.document.body.children[0]);
}

export function verifyATBehavior(atBehavior) {
  // This is temporary until transition is complete from multiple modes to one mode
  let mode = typeof atBehavior.mode === 'string' ? atBehavior.mode : atBehavior.mode[0];

  let newBehavior = Object.assign({}, atBehavior, { mode: mode });
  newBehavior.commands = commapi.getATCommands(mode, atBehavior.task, at);

  newBehavior.output_assertions = newBehavior.output_assertions ? newBehavior.output_assertions : [];
  newBehavior.additional_assertions = newBehavior.additional_assertions
    ? atBehavior.additional_assertions[at.key] || []
    : [];
  if (!behavior && newBehavior.commands.length) {
    behavior = newBehavior;
  } else {
    throw new Error('Test files should only contain one verifyATBehavior call.');
  }
}

export function displayTestPageAndInstructions(testPage) {
  testPageUri = testPage;

  if (document.readyState !== 'complete') {
    window.setTimeout(() => {
      displayTestPageAndInstructions(testPage);
    }, 100);
    return;
  }

  document.querySelector('html').setAttribute('lang', 'en');
  document.body.innerHTML = (TEST_HTML_OUTLINE);
  var style = document.createElement('style');
  style.innerHTML = PAGE_STYLES;
  document.head.appendChild(style);

  showUserError();

  displayInstructionsForBehaviorTest();
}

function displayInstructionsForBehaviorTest() {

  function getSetupInstructions() {
    let html = '';
    for (let i = 0; i < (userInstructions.length - 1); i++) {
      html += `<li><em>${userInstructions[i]}</em></li>`;
    }
    return html;
  }

  // First, execute necesary set up script in test page if the test page is open from a previous behavior test
  if (testPageWindow) {
    putTestPageWindowIntoCorrectState();
  }

  const mode = behavior.mode;
  const modeInstructions = commapi.getModeInstructions(mode, at);
  const userInstructions = behavior.specific_user_instruction.split('|');
  const lastInstruction = userInstructions[userInstructions.length-1];
  const commands = behavior.commands;
  const assertions = behavior.output_assertions.map((a) => a[1]);
  const additionalBehaviorAssertions = behavior.additional_assertions;
  const setupScriptDescription = behavior.setup_script_description ? ` and runs a script that ${behavior.setup_script_description}.` : behavior.setup_script_description;
  // As a hack, special case mode instructions for VoiceOver for macOS until we support modeless tests.
  // ToDo: remove this when resolving issue #194
  const modePhrase = at.name === "VoiceOver for macOS" ? "Describe " : `With ${at.name} in ${mode} mode, describe `;

  let instructionsEl = document.getElementById('instructions');
  instructionsEl.innerHTML = `
<h1 id="behavior-header" tabindex="0">Testing task: ${document.title}</h1>
<p>${modePhrase} how ${at.name} behaves when performing task "${lastInstruction}"</p>
<h2>Test instructions</h2>
<ol aria-label="Instructions">
  <li>Restore default settings for ${at.name}. For help, read <a href="https://github.com/w3c/aria-at/wiki/Configuring-Screen-Readers-for-Testing">Configuring Screen Readers for Testing</a>.</li>
  <li>Activate the "Open test page" button below, which opens the example to test in a new window${setupScriptDescription}</li>
  <li id="mode-instructions-li"><em>${modeInstructions}</em></li>
  ${getSetupInstructions()}
  <li>Using the following commands, ${lastInstruction}
    <ul id='at_controls' aria-label='Commands'>
    </ul>
  </li>
</ol>
<h3>Success Criteria</h3>
<p>To pass this test, ${at.name} needs to meet all the following assertions when each  specified command is executed:</p>
<ul id='assertions' aria-label="Assertions">
</ul>
`;

  // Hack to remove mode instructions for VoiceOver for macOS to get us by until we support modeless screen readers.
  // ToDo: remove this when resolving issue #194
  if (at.name === "VoiceOver for macOS") {
    let modeInstructionsEl= document.getElementById('mode-instructions-li');
    modeInstructionsEl.parentNode.removeChild(modeInstructionsEl);
  }

  for (let command of commands) {
    let commandEl = document.createElement('li');
    commandEl.innerHTML = `${command}`;
    document.getElementById('at_controls').append(commandEl);
  }

  for (let assertion of assertions) {
    let el = document.createElement('li');
    el.innerHTML = `<em>${assertion}</em>`;
    document.getElementById('assertions').append(el);
  }

  for (let additional of additionalBehaviorAssertions) {
    let el = document.createElement('li');
    el.innerHTML = `<em>${additional[1]}</em>`;
    document.getElementById('assertions').append(el);
  }

  let openButton = document.createElement('button');
  openButton.id = 'open-test-page';
  openButton.innerText = "Open Test Page";
  openButton.addEventListener('click', openTestPagePopup);
  if (testPageWindow) {
    openButton.disabled = true;
  }
  document.getElementById('instructions').append(openButton);

  let recordResults = `<h2>Record Results</h2><p>${document.title}</p>`;

  for (let c = 0; c < commands.length; c++) {
    recordResults += `<section id="cmd-${c}-section"><h3 id="header-cmd-${c}">After '${commands[c]}'</h3>`;
    recordResults += `
<p id="cmd-${c}-output">
  <label for="speechoutput-${c}">${at.name} output after ${commands[c]} <span class="required">(required)</span>:</label>
    <textarea id="speechoutput-${c}"></textarea>
</p>
`;

    recordResults += `<table id="cmd-${c}" class="record-results">
<tr>
  <th>Assertion</th>
  <th>
    Success case
  </th>
  <th>
    Failure cases
  </th>
</tr>
`;

    for (let a = 0; a < assertions.length; a++) {
      recordResults += `
<tr>
  <td id="assertion-${c}-${a}"><div class="assertion">${assertions[a]}</div><div class="required">(required: mark output)</div></td>
  <td>
      <input type="radio" id="pass-${c}-${a}" class="pass" name="result-${c}-${a}" aria-labelledby="pass-${c}-${a}-label assertion-${c}-${a}">
      <label id="pass-${c}-${a}-label">Good Output <span class="off-screen">for assertion</span></label>
  </td>
  <td>
      <input type="radio" id="missing-${c}-${a}" class="missing" name="result-${c}-${a}" aria-labelledby="missing-${c}-${a}-label assertion-${c}-${a}">
      <label id="missing-${c}-${a}-label">No Output <span class="off-screen">for assertion</span></label>
      <input type="radio" id="fail-${c}-${a}" class="fail" name="result-${c}-${a}" aria-labelledby="fail-${c}-${a}-label assertion-${c}-${a}">
      <label id="fail-${c}-${a}-label">Incorrect Output <span class="off-screen">for assertion</span></label>
  </td>
</tr>
`;
    }

    for (let n = 0; n < additionalBehaviorAssertions.length; n++) {
      let a = assertions.length + n;
      recordResults += `
<tr>
  <td id="assertion-${c}-${a}"><div class="assertion">${additionalBehaviorAssertions[n][1]}</div><div class="required">(required: mark support)</div></td>
  <td>
      <input type="radio" id="pass-${c}-${a}" class="pass" name="result-${c}-${a}" aria-labelledby="pass-${c}-${a}-label assertion-${c}-${a}">
      <label id="pass-${c}-${a}-label">Good Support <span class="off-screen">for assertion</span></label>
  </td>
  <td>
      <input type="radio" id="fail-${c}-${a}" class="fail" name="result-${c}-${a}" aria-labelledby="fail-${c}-${a}-label assertion-${c}-${a}">
      <label id="fail-${c}-${a}-label">No Support <span class="off-screen">for assertion</span></label>
  </td>
</tr>
`;
    }

    recordResults += '</table>';

    recordResults += `
  <fieldset id="cmd-${c}-problem">
Were there additional undesirable behaviors? <span class="required">(required)</span>
<div>
  <input type="radio" id="problem-${c}-false" class="pass" name="problem-${c}">
  <label for="problem-${c}-false">No, there were no additional undesirable behaviors.</label>
</div>
<div>
  <input type="radio" id="problem-${c}-true" class="fail" name="problem-${c}">
  <label for="problem-${c}-true">Yes, there were additional undesirable behaviors</label>
</div>
  <fieldset class="problem-select" id="cmd-${c}-problem-checkboxes">
  <legend>Undesirable behaviors<span class="required"> (required)<span></legend>
`;

  for (let undesirable of UNDESIRABLES) {
    const string = `
      <input type="checkbox" value="${undesirable}" id="${undesirable}-${c}" class="undesirable-${c}" tabindex="-1" disabled>
      <label for="${undesirable}-${c}">${undesirable}</label>
      <br>
     `;
    recordResults += string;
  }

  recordResults += `
     <input type="checkbox" value="Other" id="undesirable-${c}-other" name="undesirable-${c}-other" class="undesirable-${c}" tabindex="-1">
     <label for="undesirable-${c}-other">Other</label>
     </br>
     <div>
       <label for="undesirable-${c}-other-input">If "other" selected, explain <span class="required-other">(required)</span>:</label>
       <input type="text" name="undesirable-${c}-other-input" id="undesirable-${c}-other-input" class="undesirable-other-input" disabled>
     </div>
  </div>
</fieldset>
`;

    recordResults += `</section>`;
  }

  let recordEl = document.getElementById('record-results');
  recordEl.innerHTML = recordResults;

  let radios = document.querySelectorAll('input[type="radio"]');
  for (let radio of radios) {
    radio.onclick = handleRadioClick;
  }

  let checkboxes = document.querySelectorAll('input[type=checkbox]');
  for (let checkbox of checkboxes) {
    checkbox.onchange = handleUndesirableSelect;
    checkbox.addEventListener('keydown', handleUndesirableKeydown);
  }

  let otherUndesirableInput = document.querySelectorAll('.undesirable-other-input');
  for (let otherInput of otherUndesirableInput) {
    otherInput.addEventListener('change', handleOtherUndesirableInput);
  }

  if (showSubmitButton) {
    // Submit button
    let el = document.createElement('button');
    el.id = 'submit-results';
    el.innerText = 'Submit Results';
    el.addEventListener('click', submitResult);
    recordEl.append(el);
  }

  document.querySelector('#behavior-header').focus();

  // if test is loaded in iFrame
  if (window.parent && window.parent.postMessage) {
    // results can be submitted by parent posting a message to the
    // iFrame with a data.type property of 'submit'
    window.addEventListener('message', function(message) {
      if (!validateMessage(message, 'submit')) return;
      submitResult();
    });

    // send message to parent that test has loaded
    window.parent.postMessage({
      type: 'loaded',
      data: {
        testPageUri: testPageUri
      }
    }, '*');
  }
}

function validateMessage(message, type) {
  if (window.location.origin !== message.origin) {
    return false;
  }
  if (!message.data || typeof message.data !== 'object') {
    return false;
  }
  if (message.data.type !== type) {
    return false;
  }
  return true;
}

function handleUndesirableSelect(event) {
  let radioId = event.target.id;
  let cmdId, otherSelected;
  if (radioId) {
    cmdId = Number(radioId.split('-')[1]);
    otherSelected = document.querySelector(`#undesirable-${cmdId}-other`);
    if (otherSelected && otherSelected.checked == true) {
      document.querySelector(`#undesirable-${cmdId}-other-input`).disabled = false;
    } else {
      document.querySelector(`#undesirable-${cmdId}-other-input`).disabled = true;
      document.querySelector(`#undesirable-${cmdId}-other-input`).value = '';
    }
  }

  // Handle any checkbox selected
  let radioName = event.target.name;
  if (radioName) {
    cmdId = Number(radioName.split('-')[1]);
    document.querySelector(`#problem-${cmdId}-true`).checked = true;
  }
}

function handleOtherUndesirableInput(event) {
  let inputId = event.target.id;
  let cmd = inputId.split('-')[1];

  let otherCheckbox = document.querySelector(`#undesirable-${cmd}-other`);
  if (event.target.value) {
    otherCheckbox.checked = true;
  }
  else {
    otherCheckbox.checked = false;
  }
}

function handleRadioClick(event) {
  let radioId = event.target.id;
  let cmdId = Number(radioId.split('-')[1]);

  let markedAs = radioId.split('-')[2];
  let checkboxes = document.querySelectorAll(`.undesirable-${cmdId}`);
  let otherInput = document.querySelector(`#undesirable-${cmdId}-other-input`);
  if (markedAs === 'true') {
    checkboxes[0].tabIndex = 0;
    for (let checkbox of checkboxes) {
      checkbox.disabled = false;
    }
    otherInput.disabled = false;
  } else {
    for (let checkbox of checkboxes) {
      checkbox.disabled = true;
      checkbox.checked = false;
    }
    otherInput.disabled = true;
    otherInput.value = '';
  }
}

function handleUndesirableKeydown(event) {
  var checkbox = event.currentTarget,
    flag = false;

  switch (event.key) {
    case 'Up':
    case 'ArrowUp':
    case 'Left':
    case 'ArrowLeft':
      setFocusToPreviousItem(checkbox);
      flag = true;
      break;

    case 'Down':
    case 'ArrowDown':
    case 'Right':
    case 'ArrowRight':
      setFocusToNextItem(checkbox);
      flag = true;
      break;

    default:
      break;
  }

  if (flag) {
    event.stopPropagation();
    event.preventDefault();
  }
}

function setFocusToPreviousItem(checkbox) {
  let cmd = checkbox.parentElement.id.split('-')[1];
  let checkboxNodes = document.querySelectorAll(`#cmd-${cmd}-problem input[type=checkbox]`);
  let checkboxes = Array.from(checkboxNodes);

  let checkboxIds = checkboxes.map(c => c.id);
  let index = checkboxIds.indexOf(checkbox.id);

  checkboxNodes[index].tabIndex = -1;

  if (index === 0) {
    checkboxNodes[checkboxes.length - 1].tabIndex = 0;
    checkboxNodes[checkboxes.length - 1].focus();
  }
  else {
    checkboxNodes[index - 1].tabIndex = 0;
    checkboxNodes[index - 1].focus();
  }
}

function setFocusToNextItem(checkbox) {
  let cmd = checkbox.parentElement.id.split('-')[1];
  let checkboxNodes = document.querySelectorAll(`#cmd-${cmd}-problem input[type=checkbox]`);
  let checkboxes = Array.from(checkboxNodes);

  let checkboxIds = checkboxes.map(c => c.id);
  let index = checkboxIds.indexOf(checkbox.id);

  checkboxNodes[index].tabIndex = -1;
  index++;

  if (index === checkboxes.length) {
    checkboxNodes[0].tabIndex = 0;
    checkboxNodes[0].focus();
  }
  else {
    checkboxNodes[index].tabIndex = 0;
    checkboxNodes[index].focus();
  }
}

function validateResults() {

  let focusEl;
  for (let c = 0; c < behavior.commands.length; c++) {

    // If there is no output recorded, mark the screen reader output as required
   let outputParagraph = document.getElementById(`cmd-${c}-output`);
   let cmdInput = outputParagraph.querySelector('textarea');
    if (!cmdInput.value) {
      focusEl = focusEl || cmdInput;
      outputParagraph.querySelector('.required').classList.add('highlight-required');
    } else {
      outputParagraph.querySelector('.required').classList.remove('highlight-required');
    }

    // If "all pass" is selected, remove "required" mark any remaining assertions (because they will
    // all have been marked as passing, now) and move to the next command

    let numAssertions = document.getElementById(`cmd-${c}`).rows.length - 1;
    let undesirableFieldset = document.getElementById(`cmd-${c}-problem`);

    // Otherwise, we must go though each assertion and add or remove the "required" mark
    for (let a = 0; a < numAssertions; a++) {
      let selectedRadio = document.querySelector(`input[name="result-${c}-${a}"]:checked`);
      if (!selectedRadio) {
        document.querySelector(`#assertion-${c}-${a} .required`).classList.add('highlight-required');
        focusEl = focusEl || document.getElementById(`pass-${c}-${a}`);
      }
      else {
        document.querySelector(`#assertion-${c}-${a} .required`).classList.remove('highlight-required');
      }
    }


    // Check that the "unexpected/additional problems" fieldset is filled out
    let problemRadio = document.querySelector(`input[name="problem-${c}"]:checked`);
    let problemSelected = document.querySelectorAll(`.undesirable-${c}:checked`);
    let otherSelected = document.querySelector(`#undesirable-${c}-other:checked`);
    let otherText = document.querySelector(`#undesirable-${c}-other-input`).value;
    if (!problemRadio || (problemRadio.classList.contains('fail') && problemSelected.length === 0 && !otherSelected)) {
        undesirableFieldset.classList.add('highlight-required');
    }
    if (!problemRadio || (problemRadio.classList.contains('fail') && problemSelected.length === 0 && !otherSelected)) {
      document.querySelector(`#cmd-${c}-problem legend .required`).classList.add('highlight-required');
      focusEl = focusEl || document.querySelector(`#cmd-${c}-problem input[type="checkbox"]`);
    }
    else if (document.querySelector(`input#problem-${c}-false:checked`) || (problemRadio && problemSelected.length > 0) || (otherSelected && otherText)) {
      document.querySelector(`#cmd-${c}-problem legend .required`).classList.remove('highlight-required');
      undesirableFieldset.classList.remove('highlight-required');
    }

    if (otherSelected) {
      if (!otherText) {
        document.querySelector(`#cmd-${c}-problem .required-other`).classList.add('highlight-required');
        undesirableFieldset.classList.add('highlight-required');
        focusEl = focusEl || document.querySelector(`#undesirable-${c}-other-input`);
      }
      else {
        document.querySelector(`#cmd-${c}-problem .required-other`).classList.remove('highlight-required');
        undesirableFieldset.classList.remove('highlight-required');
      }
    }
  }

  if (focusEl) {
    focusEl.focus();
    return false;
  }
  return true;
}


function submitResult(event) {
  if (!validateResults()) {
    return;
  }

  const assertionPriority = {};
  for (let a = 0; a < behavior.output_assertions.length; a++) {
    const assertion = behavior.output_assertions[a];
    assertionPriority[assertion[1]] = assertion[0];
  }

  for (let a = 0; a < behavior.additional_assertions.length; a++) {
    const assertion = behavior.additional_assertions[a];
    assertionPriority[assertion[1]] = assertion[0];
  }

  const summary = {
    1: {pass: 0, fail: 0},
    2: {pass: 0, fail: 0},
    unexpectedCount: 0
  };

  overallStatus = 'PASS';

  const commandResults = [];

  for (let c = 0; c < behavior.commands.length; c++) {

    let assertions = [];
    let support = 'FULL';
    let totalAssertions = document.querySelectorAll(`#cmd-${c} tr`).length - 1;

    for (let a = 0; a < totalAssertions; a++) {
      const assertion = document.querySelector(`#assertion-${c}-${a} .assertion`).innerHTML;
      const resultEl = document.querySelector(`input[name="result-${c}-${a}"]:checked`);
      const resultId = resultEl.id;
      const pass = resultEl.classList.contains('pass');
      const result = document.querySelector(`#${resultId}-label`).innerHTML.split('<span')[0];
      const priority = assertionPriority[assertion];

      let assertionResult = {
        assertion,
        priority
      };

      if (pass) {
        assertionResult.pass = result;
        summary[priority].pass++;
      }
      else {
        assertionResult.fail = result;
        summary[priority].fail++;

        // If any priority 1 assertion fails, the test fails for this command
        if (priority === 1) {
          support = 'FAILING';
          overallStatus = 'FAIL';
        }
        // If any only a priority >1 assertion fails, then this test meets the all required pass case
        else if (support !== 'FAILING') {
          support = 'ALL REQUIRED';
        }
      }

      assertions.push(assertionResult);
    }

    const unexpected = [];
    for (let problemEl of document.querySelectorAll(`#cmd-${c}-problem fieldset input:checked`)) {
      support = 'FAILING';
      overallStatus = 'FAIL';
      summary.unexpectedCount++;
      if (problemEl.value === 'Other') {
        unexpected.push(document.querySelector(`#undesirable-${c}-other-input`).value);
      }
      else {
        unexpected.push(problemEl.value);
      }
    }

    commandResults.push({
      command: behavior.commands[c],
      output: document.querySelector(`#speechoutput-${c}`).value,
      unexpected_behaviors: unexpected,
      support,
      assertions
    });
  }

  behaviorResults = {
    name: document.title,
    specific_user_instruction: behavior.specific_user_instruction,
    task: behavior.task,
    commands: commandResults,
    summary
  };

  let data = {
    test: document.title,
    details: behaviorResults,
    status: overallStatus
  };

  // send message to parent if test is loaded in iFrame
  if (window.parent && window.parent.postMessage) {
    window.parent.postMessage({
      type: 'results',
      data: data
    }, '*');
  }

  endTest();

  if (showResults) {
    showResultsTable();
  }

  appendJSONResults(data);
}


function showResultsTable() {
  let resulthtml = `<h1>${document.title}</h1><h2 id=overallstatus></h2>`;

  resulthtml += `<table>
    <tr>
      <th>Command</th>
      <th>Support</th>
      <th>Details</th>
    </tr>
  `;

  for (let command of behaviorResults.commands) {

      let passingAssertions = '';
      let failingAssertions = '';
      for (let assertion of command.assertions) {
        if (assertion.pass) {
          passingAssertions += `<li>${assertion.assertion}</li>`;
        }
        if (assertion.fail) {
          failingAssertions += `<li>${assertion.assertion}</li>`;
        }
      }
      let unexpectedBehaviors = '';
      for (let unexpected of command.unexpected_behaviors) {
        unexpectedBehaviors += `<li>${unexpected}</li>`;
      }
      passingAssertions = passingAssertions === '' ? '<li>No passing assertions.</li>' : passingAssertions;
      failingAssertions = failingAssertions === '' ? '<li>No failing assertions.</li>' : failingAssertions;
      unexpectedBehaviors = unexpectedBehaviors === '' ? '<li>No unexpect behaviors.</li>' : unexpectedBehaviors;


      resulthtml+= `
<tr>
  <td>${command.command}</td>
  <td>${command.support}</td>
  <td>
    <p>${at.name} output:<br> "${command.output.replace(/(?:\r\n|\r|\n)/g, '<br>')}"</p>
    <div>Passing Assertions:
      <ul>
      ${passingAssertions}
      </ul>
    </div>
    <div>Failing Assertions:
      <ul>
      ${failingAssertions}
      </ul>
    </div>
    <div>Unexpected Behavior:
      <ul>
      ${unexpectedBehaviors}
      </ul>
    </div>
  </td>
</tr>
`;

    }

  resulthtml += `</table>`;

  document.body.innerHTML = resulthtml;
  document.querySelector('#overallstatus').innerHTML = `Test result: ${overallStatus}`;
}

function endTest() {
  if (typeof testPageWindow !== 'undefined') {
    testPageWindow.close();
  }
}

function showUserError() {
  if (errors.length) {
    document.getElementById('errors').style.display = "block";
    let errorListEl = document.querySelector('#errors ul');
    for (let error of errors) {
      let errorMsgEl = document.createElement('li');
      errorMsgEl.innerText = error;
      errorListEl.append(errorMsgEl);
    }
  }
}

function appendJSONResults(data) {
  var results_element = document.createElement("script");
  results_element.type = "text/json";
  results_element.id = "__ariaatharness__results__";
  results_element.textContent = JSON.stringify(data);

  document.body.appendChild(results_element);
}
