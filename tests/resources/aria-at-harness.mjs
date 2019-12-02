import {isKnownAT, getATCommands, getModeInstructions, getAdditionalAssertions} from './at-commands.mjs';

const DEFAULT_AT = 'JAWS';
const UNDESIRABLES = [
  "Output is excessively verbose, e.g., includes redundant and/or irrelevant speech",
  "Reading cursor position changed in an unexpected manner",
  "Screen reader became extremely sluggish",
  "Screen reader crashed",
  "Browser crashed"
];

const TEST_HTML_OUTLINE = `
<main>
  <section id='errors' style='display:none'><h2>Test cannot be performed due to error(s)!</h2><ul></ul><hr></section>
  <section id='instructions'></section>
  <section id='record-results'></section>
</main>
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

  .required:not(.highlight-required) {
    display: none;
  }

  .required-other:not(.highlight-required) {
    display: none;
  }

  table .required.highlight-required {
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

const allBehaviors = [];
const allBehaviorResults = [];
const errors = [];
let currentTestedBehavior = 0;
let testPageUri;
let testPageWindow;

let at = DEFAULT_AT;

let params = (new URL(document.location)).searchParams;
for (const [key, value] of params) {
  if (key === 'at') {
    let requestedAT = value;
    if (isKnownAT(requestedAT)) {
      at = isKnownAT(requestedAT);
    }
    else {
      errors.push(`Harness does not have commands for the requested assistive technology ('${requestedAT}'), showing commands for assitive technology '${DEFAULT_AT}' instead. To test '${requestedAT}', please contribute command mappings to this project.`);
    }
  }
}

function openTestPagePopup() {
  testPageWindow = window.open(testPageUri, '_blank', 'toolbar=0,location=0,menubar=0,width=400,height=400');

  document.getElementById('open-test-page').disabled = true;

  // If the window is closed, re-enable open popup button
  testPageWindow.onunload = function(event) {
    window.setTimeout(() => {
      if (testPageWindow.closed) {
	testPageWindow = undefined;
	document.getElementById('open-test-page').disabled = false;
      }
    }, 100);

  };

  executeScriptInTestPage();
}

function putTestPageWindowIntoCorrectState() {
  // testPageWindow.location.reload(); // TODO: Address the race condition this causes with script execution.
  executeScriptInTestPage();
}

function executeScriptInTestPage() {
  let setupTestPage = allBehaviors[currentTestedBehavior].setupTestPage;
  if (setupTestPage) {
    if (testPageWindow.document.readyState !== 'complete') {
      window.setTimeout(() => {
	executeScriptInTestPage();
      }, 100);
      return;
    }

    setupTestPage(testPageWindow.document);
  }
}

export function verifyATBehavior(behavior) {
  for (let m = 0; m < behavior.mode.length; m++) {
    let newBehavior = Object.assign({}, behavior, { mode: behavior.mode[m] });
    newBehavior.commands = getATCommands(behavior.mode[m], behavior.task, at);
    newBehavior.output_assertions = newBehavior.output_assertions ? newBehavior.output_assertions : [];
    newBehavior.additional_assertions = newBehavior.additional_assertions
      ? behavior.additional_assertions[at.toLowerCase()] || []
      : [];
    if (newBehavior.commands.length) {
      allBehaviors.push(newBehavior);
    }
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

  if (allBehaviors.length > 0) {
    displayInstructionsForBehaviorTest(0);
  }
}

function displayInstructionsForBehaviorTest(behaviorId) {
  // First, execute necesary set up script in test page if the test page is open from a previous behavior test
  if (testPageWindow) {
    putTestPageWindowIntoCorrectState();
  }

  const totalBehaviors = allBehaviors.length;
  const behavior = allBehaviors[behaviorId];

  const mode = behavior.mode;
  const modeInstructions = getModeInstructions(mode, at);
  const userInstructions = behavior.specific_user_instruction;
  const commands = behavior.commands;
  const assertions = behavior.output_assertions.map((a) => a[1]);

  const additionalBehaviorAssertions = behavior.additional_assertions.map((a) => a[1]);

  let instructionsEl = document.getElementById('instructions');
  instructionsEl.innerHTML = `
<h1 id="behavior-header" tabindex="0">Testing task: ${behavior.task}</h1>
<p>How does ${at} respond after task "${userInstructions}" is performed in ${mode} mode?</p>
<h2>Test instructions</h2>
<ol>
  <li><em>${modeInstructions}</em></li>
  <li>Then, perform the task "<em>${userInstructions}</em>" using the following commands:
    <ul id='at_controls' aria-label='AT controls'>
    </ul>
  </li>
</ol>
<h3>Success Criteria</h3>
<p>For this test to pass, the following assertions must be met for every possible command:</p>
<ul id='assertions'>
</ul>
`;

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
    el.innerHTML = `<em>${additional.assertion}</em>`;
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
    recordResults += `<section id="cmd-${c}-section"><h3 id="header-cmd-${c}">After: '${commands[c]}'</h3>`;
    recordResults += `
<p>
  <fieldset id="cmd-${c}-summary">
    <label for="speechoutput-${c}">Relevant speech output after command <span class="required">(required)</span>:</label>
    <input type="text" id="speechoutput-${c}">
    <div>
      <input type="radio" id="allpass-${c}" class="allpass" name="allresults-${c}">
      <label for="allpass-${c}">All assertions have been meet after ${commands[c]} and there was no additional unexpected or undesirable behaviors.</label>
    </div>
    <div>
      <input type="radio" id="somefailure-${c}" class="somefailure" name="allresults-${c}">
      <label for="somefailure-${c}">Some assertions have not been met after ${commands[c]} or there as an additional unexpected or undesirable behavior.</label>
    </div>
  </fieldset>
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
      <label for="fail-${c}-${a}-label">Incorrect Output <span class="off-screen">for assertion</span></label>
  </td>
</tr>
`;
    }

    let additionalAssertions = getAdditionalAssertions(additionalBehaviorAssertions, commands[c], mode);
    for (let n = 0; n < additionalAssertions.length; n++) {
      let a = assertions.length + n;
      recordResults += `
<tr>
  <td id="assertion-${c}-${a}"><div class="assertion">${additionalAssertions[n]}</div><div class="required">(required: mark support)</div></td>
  <td>
      <input type="radio" id="pass-${c}-${a}" class="pass" name="result-${c}-${a}" aria-labelledby="pass-${c}-${a}-label assertion-${c}-${a}">
      <label for="pass-${c}-${a}-label">Good Support <span class="off-screen">for assertion</span></label>
  </td>
  <td>
      <input type="radio" id="fail-${c}-${a}" class="fail" name="result-${c}-${a}" aria-labelledby="fail-${c}-${a}-label assertion-${c}-${a}">
      <label for="fail-${c}-${a}-label">No Support <span class="off-screen">for assertion</span></label>
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
  <label for="problem-${c}-false">No, there are no additional undesirable behaviors.</label>
</div>
<div>
  <input type="radio" id="problem-${c}-true" class="fail" name="problem-${c}">
  <label for="problem-${c}-true">Yes, there are additional undesirable behaviors</label>
</div>
<br>
<div>
  <label for="problem-${c}-select">Select all undesirable behaviors <span class="required">(required: select at least one or mark "No additional undesirable behaviors")</span>:</label>
</div>
<div>
  <select multiple name="problem-${c}-select" id="problem-${c}-select">
`;

    for (let undesirable of UNDESIRABLES) {
      recordResults += `<option value="${undesirable}">${undesirable}</option>`;
    }
    recordResults += `<option class="other" value="Other">Other</option>
</select>
</div>
</br>
<div>
  <label for="problem-${c}-other">If "other" selected, explain <span class="required-other">(required)</span>:</label>
  <input disabled type="text" name="problem-${c}-other" id="problem-${c}-other">
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

  let selects = document.querySelectorAll('select');
  for (let select of selects) {
    select.onchange = handleUndesirableSelect;
  }

  // Submit button
  let el = document.createElement('button');
  el.innerText = "Perform the next behavior test";
  if (behaviorId === allBehaviors.length - 1) {
    el.innerText = "Review Results";
  }
  el.value = behaviorId;
  el.addEventListener('click', submitResult);
  recordEl.append(el);

  document.querySelector('#behavior-header').focus();
}

function handleUndesirableSelect(event) {
  let radioId = event.target.id;
  let cmdId = Number(radioId.split('-')[1]);
  const otherSelected = document.querySelector(`#problem-${cmdId}-select option.other:checked`);
  if (otherSelected) {
    document.querySelector(`#problem-${cmdId}-other`).disabled = false;
  }
  else {
    document.querySelector(`#problem-${cmdId}-other`).disabled = true;
    document.querySelector(`#problem-${cmdId}-other`).value = '';
  }
  const anySelected = document.querySelector(`#problem-${cmdId}-select option:checked`);
  if (anySelected) {
    document.querySelector(`#problem-${cmdId}-true`).checked = true;
    let allradio = document.querySelector(`#cmd-${cmdId}-summary #somefailure-${cmdId}`);
    allradio.checked = true;
  }
}

function handleRadioClick(event) {
  let radioId = event.target.id;
  let cmdId = Number(radioId.split('-')[1]);

  if (radioId.indexOf('problem') === 0) {
    let markedAs = radioId.split('-')[2];
    let select = document.querySelector(`#problem-${cmdId}-select`);
    let other = document.querySelector(`#problem-${cmdId}-other`);
    if (markedAs === 'true') {
      select.disabled = false;
    }
    else {
      for (let option of document.querySelectorAll(`#cmd-${cmdId}-problem option`)) {
	option.selected = false;
      }
      select.disabled = true;
      other.disabled = true;
      other.value = '';
    }
  }

  if (radioId.indexOf('allpass') === 0) {
    for (let resultType of ['pass', 'missing', 'fail']) {
      let radios = document.querySelectorAll(`#cmd-${cmdId}-section .${resultType}`);
      let checked = resultType === 'pass' ? true : false;
      for (let radio of radios) {
	radio.checked = checked;
      }
    }
  }

  else {
    let markedAs = radioId.split('-')[0];
    if (markedAs === 'pass') {

      // We want the length of the rows because the total number of "pass" radio buttons
      // is equal to the number of rows PLUS 1 for the "additional undesirable behaviors" radio
      let numAssertions = document.getElementById(`cmd-${cmdId}`).rows.length;
      let markedPass = document.querySelectorAll(`#cmd-${cmdId}-section .pass:checked`);
      if (markedPass.length === numAssertions) {
	let allradio = document.querySelector(`#cmd-${cmdId}-summary #allpass-${cmdId}`);
	allradio.checked = true;
      }
    }
    else {
      let allradio = document.querySelector(`#cmd-${cmdId}-summary #somefailure-${cmdId}`);
      allradio.checked = true;
    }
  }
}

function validateResults() {

  let focusEl;
  for (let c = 0; c < allBehaviors[currentTestedBehavior].commands.length; c++) {

    // If there is no output recorded, mark the screen reader output as required
    let summaryFieldset = document.getElementById(`cmd-${c}-summary`);
    let cmdInput = summaryFieldset.querySelector('input[type="text"]');
    if (!cmdInput.value) {
      focusEl = focusEl || cmdInput;
      summaryFieldset.classList.add('highlight-required');
      summaryFieldset.querySelector('.required').classList.add('highlight-required');
    } else {
      summaryFieldset.classList.remove('highlight-required');
      summaryFieldset.querySelector('.required').classList.remove('highlight-required');
    }

    // If neither the "all pass" or "some failed" radios are checked, then no further results have been recorded,
    // so highlight the summaryFieldset as required.
    let allSelected = summaryFieldset.querySelector(`input[name="allresults-${c}"]:checked`);
    if (!allSelected) {
      focusEl = focusEl || document.getElementById(`allpass-${c}`);
      summaryFieldset.classList.add('highlight-required');
    }

    // If "all pass" is selected, remove "required" mark any remaining assertions (because they will
    // all have been marked as passing, now) and move to the next command

    let numAssertions = document.getElementById(`cmd-${c}`).rows.length - 1;
    let undesirableFieldset = document.getElementById(`cmd-${c}-problem`);

    if ( summaryFieldset.querySelector('.allpass').checked || !allSelected ) {
      for (let a = 0; a < numAssertions; a++) {
	document.querySelector(`#assertion-${c}-${a} .required`).classList.remove('highlight-required');
      }

      undesirableFieldset.classList.remove('highlight-required');
    }

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
    let problemSelected = document.querySelector(`#problem-${c}-select option:checked`);
    let otherSelected = document.querySelector(`#problem-${c}-select option.other:checked`);
    let otherText = document.querySelector(`#problem-${c}-other`).value;
    if (!problemRadio || (problemRadio.classList.contains('fail') && !problemSelected) || (otherSelected && !otherText)) {
	undesirableFieldset.classList.add('highlight-required');
    }
    if (!problemRadio || (problemRadio.classList.contains('fail') && !problemSelected)) {
      document.querySelector(`#cmd-${c}-problem .required`).classList.add('highlight-required');
      focusEl = focusEl || document.querySelector(`#cmd-${c}-problem input[type="radio"]`);
    }
    else if (problemRadio && problemSelected) {
      document.querySelector(`#cmd-${c}-problem .required`).classList.remove('highlight-required');
      focusEl = focusEl || document.querySelector(`#cmd-${c}-problem input[type="select"]`);
    }
    if (otherSelected) {
      if (!otherText) {
	document.querySelector(`#cmd-${c}-problem .required-other`).classList.add('highlight-required');
	focusEl = focusEl || document.querySelector(`#cmd-${c}-problem select`);
      }
      else {
	document.querySelector(`#cmd-${c}-problem .required-other`).classList.remove('highlight-required');
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
  for (let a = 0; a < allBehaviors[currentTestedBehavior].output_assertions.length; a++) {
    const assertion = allBehaviors[currentTestedBehavior].output_assertions[a];
    assertionPriority[assertion[1]] = assertion[0];
  }

  for (let a = 0; a < allBehaviors[currentTestedBehavior].additional_assertions.length; a++) {
    const assertion = allBehaviors[currentTestedBehavior].additional_assertions[a].assertion;
    assertionPriority[assertion[1]] = assertion[0];
  }

  const summary = {
    1: {pass: 0, fail: 0},
    2: {pass: 0, fail: 0},
    3: {pass: 0, fail: 0},
    unexpectedCount: 0
  };

  const commandResults = [];

  for (let c = 0; c < allBehaviors[currentTestedBehavior].commands.length; c++) {

    let assertions = [];
    let support = 'FULL';
    let totalAssertions = document.querySelectorAll(`#cmd-${c} tr`).length - 1;

    for (let a = 0; a < totalAssertions; a++) {
      const assertion = document.querySelector(`#assertion-${c}-${a} .assertion`).innerHTML;
      const resultEl = document.querySelector(`input[name="result-${c}-${a}"]:checked`);
      const resultId = resultEl.id;
      const pass = resultEl.classList.contains('pass');
      const result = document.querySelector(`label[for="${resultId}"]`).innerHTML;
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
	}
	// If any only a priority >1 assertion fails, then this test meets the all required pass case
	else if (support !== 'FAILING') {
	  support = 'ALL REQUIRED';
	}
      }

      assertions.push(assertionResult);
    }

    const unexpected = [];
    for (let problemEl of document.querySelectorAll(`#problem-${c}-select option:checked`)) {
      support = 'FAILING';
      summary.unexpectedCount++;
      if (problemEl.classList.contains('other')) {
	unexpected.push(document.querySelector(`#problem-${c}-other`).value);
      }
      else {
	unexpected.push(problemEl.value);
      }
    }

    commandResults.push({
      command: allBehaviors[currentTestedBehavior].commands[c],
      output: document.querySelector(`#speechoutput-${c}`).value,
      unexpected_behaviors: unexpected,
      support,
      assertions
    });
  }

  allBehaviorResults.push({
    name: document.title,
    specific_user_instruction: allBehaviors[currentTestedBehavior].specific_user_instruction,
    task: allBehaviors[currentTestedBehavior].task,
    commands: commandResults,
    summary
  });

  //Display the next behavior
  if (currentTestedBehavior < allBehaviors.length - 1) {
    currentTestedBehavior++;
    displayInstructionsForBehaviorTest(currentTestedBehavior);
  }
  else {
    endTest();
  }
}


function endTest() {
  let resulthtml = `<h1>${document.title}</h1><h2 id=overallstatus></h2>`;
  let status = "PASS";

  for (let result of allBehaviorResults) {
    resulthtml += `<table>
  <tr>
    <th>Command</th>
    <th>Support</th>
    <th>Details</th>
  </tr>
`;

    for (let command of result.commands) {

      if (command.support === 'FAILING') {
	status = "FAIL";
      }

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
    <p>${at} output: "${command.output}"</p>
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
  }

  document.body.innerHTML = resulthtml;
  document.querySelector('#overallstatus').innerHTML = `Test result: ${status}`;

  reportResults(allBehaviorResults, status);

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

function reportResults(testResults, status) {
  var results_element = document.createElement("script");
  results_element.type = "text/json";
  results_element.id = "__ariaatharness__results__";
  var data = {
    test: document.title,
    details: testResults,
    status: status
  };
  results_element.textContent = JSON.stringify(data);

  document.body.appendChild(results_element);
}
