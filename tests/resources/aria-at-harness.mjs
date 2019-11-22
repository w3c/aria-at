import {isKnownAT, getATCommands, getModeInstructions, getAdditionalAssertions} from './at-commands.mjs';

const DEFAULT_AT = 'JAWS';
const UNDESIRABLES = [
  "Assistive technology produced irrelevent and distracting output.",
  "Cursor jumped to annoying location.",
  "Assitive technology crashed.",
  "Browser crashed or froze.",
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

  table .required:not(.highlight-required) {
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
  const assertions = behavior.output_assertions;
  const additionalBehaviorAssertions = behavior.additional_assertions || [];

  let instructionsEl = document.getElementById('instructions');
  instructionsEl.innerHTML = `
<h1 id="behavior-header" tabindex="0">Testing behavior ${behaviorId+1} of ${totalBehaviors}</h1>
<p>How does ${at} respond after task "${userInstructions}" is performed in ${mode} mode?</p>
<h2>Test instructions</h2>
<ol>
  <li><em>${modeInstructions}</em></li>
  <li>Then, perform the task "<em>${userInstructions}</em>" using each of the following methods:
    <ul id='at_controls' aria-label='AT controls'>
    </ul>
  </li>
</ol>
<h3>Success Criteria</h3>
<p>For this test to pass, the following assertions must be met for every possible command:</p>
<ul id='assertions'>
</ul>
`;

  let currentInstruction = commands[0][0];
  let instructionEl = document.createElement('li');
  instructionEl.innerHTML = `${currentInstruction}`;
  document.getElementById('at_controls').append(instructionEl);
  let instructionListEl = document.createElement('ul');
  document.getElementById('at_controls').append(instructionListEl);


  for (let command of commands) {
    if (command[0] !== currentInstruction) {
      currentInstruction = command[0];
      instructionEl = document.createElement('li');
      instructionEl.innerHTML = `${currentInstruction}`;
      document.getElementById('at_controls').append(instructionEl);
      instructionListEl = document.createElement('ul');
      document.getElementById('at_controls').append(instructionListEl);
    }
    let el = document.createElement('li');
    el.innerHTML = `<em>${command[1]}</em>`;
    instructionListEl.append(el);
  }

  for (let assertion of assertions) {
    let el = document.createElement('li');
    el.innerHTML = `<em>${assertion}</em>`;
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
    recordResults += `<h3 id="header-cmd-${c}">After: '${commands[c][0]} ${commands[c][1]}'</h3>`;
    recordResults += `
<p>
  <fieldset id="cmd-${c}-summary">
    <label for="speechoutput-${c}">Relevant speech output after command <span class="required">(required)</span>:</label>
    <input type="text" id="speechoutput-${c}">
    <div>
      <input type="radio" id="allpass-${c}" class="allpass" name="allresults-${c}">
      <label for="allpass-${c}">All assertions have been meet after ${commands[c][1]} and there was no additional unexpected or undesirable behaviors.</label>
    </div>
    <div>
      <input type="radio" id="somefailure-${c}" class="somefailure" name="allresults-${c}">
      <label for="somefailure-${c}">Some assertions have not been met after ${commands[c][1]} or there as an additional unexpected or undesirable behavior.</label>
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
      <input type="radio" id="pass-${c}-${a}" class="pass" name="result-${c}-${a}">
      <label for="pass-${c}-${a}">Good Output</label>
  </td>
  <td>
      <input type="radio" id="missing-${c}-${a}" class="missing" name="result-${c}-${a}">
      <label for="missing-${c}-${a}">No Output</label>
      <input type="radio" id="fail-${c}-${a}" class="fail" name="result-${c}-${a}">
      <label for="fail-${c}-${a}">Incorrect Output</label>
  </td>
</tr>
`;
    }

    let additionalAssertions = getAdditionalAssertions(additionalBehaviorAssertions, commands[c][1], mode, at);
    for (let n = 0; n < additionalAssertions.length; n++) {
      let a = assertions.length + n;
      recordResults += `
<tr>
  <td id="assertion-${c}-${a}"><div class="assertion">${additionalAssertions[n]}</div><div class="required">(required: mark support)</div></td>
  <td>
      <input type="radio" id="pass-${c}-${a}" class="pass" name="result-${c}-${a}">
      <label for="pass-${c}-${a}">Good Support</label>
  </td>
  <td>
      <input type="radio" id="fail-${c}-${a}" class="fail" name="result-${c}-${a}">
      <label for="fail-${c}-${a}">No Support</label>
  </td>
</tr>
`;
    }

    recordResults += '</table>';

    recordResults += `
<div>
<label for="problem-${c}">Was there additional undesirable behavior?</label>
<select name="problem-${c}" id="problem-${c}"><option value=""></option>`

    for (let undesirable of UNDESIRABLES) {
      recordResults += `<option value="${undesirable}">${undesirable}</option>`;
    }

    recordResults += `</select></div>`;
  }



  let recordEl = document.getElementById('record-results');
  recordEl.innerHTML = recordResults;

  let radios = document.querySelectorAll('input[type="radio"]');
  for (let radio of radios) {
    radio.onclick = handleRadioClick;
  }

  // Submit button
  let el = document.createElement('button');
  el.innerText = "Move to next behavior test";
  if (behaviorId === allBehaviors.length - 1) {
    el.innerText = "Finish test";
  }
  el.value = behaviorId;
  el.addEventListener('click', submitResult);
  recordEl.append(el);

  document.querySelector('#behavior-header').focus();
}


function handleRadioClick(event) {
  let radioId = event.target.id;
  let cmdId = Number(radioId.split('-')[1]);

  if (radioId.indexOf('allpass') === 0) {
    for (let resultType of ['pass', 'missing', 'fail']) {
      let radios = document.querySelectorAll(`#cmd-${cmdId} .${resultType}`);
      let checked = resultType === 'pass' ? true : false;
      for (let radio of radios) {
	radio.checked = checked;
      }
    }
  }

  else {
    let markedAs = radioId.split('-')[0];
    if (markedAs === 'pass') {

      let numAssertions = document.getElementById(`cmd-${cmdId}`).rows.length - 1;
      let markedPass = document.querySelectorAll(`#cmd-${cmdId} .pass:checked`);
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

    let fieldset = document.getElementById(`cmd-${c}-summary`);
    let cmdInput = fieldset.querySelector('input[type="text"]');
    if (!cmdInput.value) {
      focusEl = focusEl || cmdInput;
      fieldset.classList.add('highlight-required');
      fieldset.querySelector('.required').classList.add('highlight-required');
    } else {
      fieldset.classList.remove('highlight-required');
      fieldset.querySelector('.required').classList.remove('highlight-required');
    }

    let allSelected = fieldset.querySelector(`input[name="allresults-${c}"]:checked`);
    if (!allSelected) {
      focusEl = focusEl || document.getElementById(`allpass-${c}`);
      fieldset.classList.add('highlight-required');
    }

    let numAssertions = document.getElementById(`cmd-${c}`).rows.length - 1;
    if (
      fieldset.querySelector('.allpass').checked
      || !allSelected
    ) {
      for (let a = 0; a < numAssertions; a++) {
	document.querySelector(`#assertion-${c}-${a} .required`).classList.remove('highlight-required');
      }
      continue;
    }

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

  let cmdOutput = {};
  for (let c = 0; c < allBehaviors[currentTestedBehavior].commands.length; c++) {
    cmdOutput[allBehaviors[currentTestedBehavior].commands[c]] = document.querySelector(`#speechoutput-${c}`).value;
  }

  let assertionResults = {};
  let otherUndesirables = [];
  for (let assertion of allBehaviors[currentTestedBehavior].output_assertions) {
    assertionResults[assertion] = ({pass: [], fail: [], missing: []});
  }

  let additionalAssertions = allBehaviors[currentTestedBehavior].additional_assertions[at.toLowerCase()].filter(
    (assertion) => assertion.mode === allBehaviors[currentTestedBehavior].mode
  );
  for (let assertion of additionalAssertions) {
    assertionResults[assertion.assertion] = ({pass: [], fail: [], missing: []});
  }

  for (let c = 0; c < allBehaviors[currentTestedBehavior].commands.length; c++) {
    let failures = document.querySelectorAll(`#cmd-${c} .fail:checked`);
    for (let failure of failures) {
      let assertionId = Number(failure.id.split('-')[2]);
      let assertion = document.querySelector(`#assertion-${c}-${assertionId} .assertion`).innerHTML;
      assertionResults[assertion].fail.push(
	allBehaviors[currentTestedBehavior].commands[c]
      );
    }

    let successes = document.querySelectorAll(`#cmd-${c} .pass:checked`);
    for (let success of successes) {
      let assertionId = Number(success.id.split('-')[2]);
      let assertion = document.querySelector(`#assertion-${c}-${assertionId} .assertion`).innerHTML;
      assertionResults[assertion].pass.push(
	allBehaviors[currentTestedBehavior].commands[c]
      );
    }

    let missings = document.querySelectorAll(`#cmd-${c} .missing:checked`);
    for (let missing of missings) {
      let assertionId = Number(missing.id.split('-')[2]);
      let assertion = document.querySelector(`#assertion-${c}-${assertionId} .assertion`).innerHTML;
      assertionResults[assertion].missing.push(
	allBehaviors[currentTestedBehavior].commands[c]
      );
    }

    let undesirable = document.getElementById(`problem-${c}`).value;
    if (undesirable) {
      if (!otherUndesirables[undesirable]) {
	otherUndesirables[undesirable] = [];
      }
      otherUndesirables[undesirable].push(allBehaviors[currentTestedBehavior].commands[c]);
    }
  }


  let behaviorResults = [];
  let overallBehaviorResult = 'PASS';
  for (let assertionName in assertionResults) {
    let assertionResult = assertionResults[assertionName];

    // The status is fail of anything fails, or incomplete if nothing fails but somethings are incomplete
    let status = !assertionResult.missings || assertionResult.missings.length === 0 ? 'PASS' : 'INCOMPLETE';
    status = assertionResult.fail.length === 0 ? status : 'FAIL';
    status = otherUndesirables.length === 0 ? status : 'FAIL';

    behaviorResults.push({
      name: assertionName,
      status: status,
      details: assertionResult
    });

    if (status === 'FAIL') {
      overallBehaviorResult = 'FAIL';
    }
    else if (status === 'INCOMPLETE' && overallBehaviorResult === 'PASS') {
      overallBehaviorResult = 'INCOMPLETE';
    }
  }

  allBehaviorResults.push({
    status: overallBehaviorResult,
    assertionResults: behaviorResults,
    task: allBehaviors[currentTestedBehavior].specific_user_instruction,
    mode: allBehaviors[currentTestedBehavior].mode,
    speechOutputForCommand: cmdOutput,
    undesirables: Object.keys(otherUndesirables).map((undesirable) => ({ undesirable, cmds: otherUndesirables[undesirable]}))
  });

  // Display the next behavior
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

  let status = 'PASS';
  for (let result of allBehaviorResults) {

    if (result.status === 'FAIL') {
      status = 'FAIL';
    }
    else if (result.status === 'INCOMPLETE' && status === 'PASS') {
      status = 'INCOMPLETE';
    }

    resulthtml += `<p>After user performs task "${result.task}" in ${result.mode} mode, the following behavior was observed:<p>`;
    resulthtml += `<table>`;
    for (let assertionResult of result.assertionResults) {
      resulthtml += `<tr><td>${assertionResult.status}</td><td>${assertionResult.name}</td>`;

      let failingCmds = assertionResult.details.fail.map((f) => f[1]);
      let passingCmds = assertionResult.details.pass.map((p) => p[1]);
      let missingCmds = assertionResult.details.missing.map((p) => p[1]);

      resulthtml += '<td><ul>';
      if (passingCmds.length) {
	resulthtml += `<li>Passed for commands: ${passingCmds.join(', ')}.</li>`;
      }
      if (failingCmds.length) {
	resulthtml += `<li>Incorrect information supplied after commands: ${failingCmds.join(', ')}.</li>`;
      }
      if (missingCmds.length) {
	resulthtml += `<li>Incomplete or no information supplied for commands: ${missingCmds.join(', ')}.</li>`;
      }
      resulthtml += '</ul></td>';
      resulthtml += '</tr>';
    }
    resulthtml += `</table>`;

    if (result.undesirables.length > 0) {
      resulthtml += `<p>The following unwanted behaviors were observed:<p><table>`;
      for (let undesirable of result.undesirables) {
	let badCmds = undesirable.cmds.map((c) => c[1]);
	resulthtml += `<tr><td>${undesirable.undesirable}</td><td>This behavior occured after the following commands: ${badCmds.join(', ')}</td></tr>`;
      }
      resulthtml += `</table>`;
    }
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
    tests: testResults,
    status: status
  };
  results_element.textContent = JSON.stringify(data);

  document.body.appendChild(results_element);
}
