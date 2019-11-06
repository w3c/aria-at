import {isKnownAT, getATCommands, getModeInstructions} from './at-commands.mjs';

const DEFAULT_AT = 'JAWS';
const DEFAULT_RESULTS = ['All Pass', 'All Fail', 'Some Fail'];

const TEST_HTML_OUTLINE = `
<section id='errors' style='display:none'><h2>Test cannot be performed due to loading error(s).</h2></section>
<section id='instructions'></section>
<section id='record-results'></section>
`;
const PAGE_STYLES = `
  table {
    border-collapse: collapse;
    margin-bottom: 1em;
  }

  table, td {
    border: 1px solid black;
  }

  td {
    padding: .5em;
  }

  table.record-results tr:first-child {
    font-weight: bold;
  }
`;

const allBehaviors = [];
const allBehaviorResults = [];
let currentTestedBehavior = 0;
let testPageWindow;

let at = DEFAULT_AT;
if (window.location.hash) {
  let requestedAT = window.location.hash.slice(1);
  if (isKnownAT(requestedAT)) {
    at = isKnownAT(requestedAT);
  }
  else {
    showUserError(`Harness does not have commands for the requested assistive technology ('${requestedAT}'), showing commands for assitive technology '${DEFAULT_AT}' instead. To test '${requestedAT}', please contribute command mappings to this project.`);
  }
}

export function executeScriptInTestPage() {
  let func = allBehaviors[currentTestedBehavior].setupTestPage;
  if (func) {
    if (testPageWindow.document.readyState !== 'complete') {
      window.setTimeout(() => {
	executeScriptInTestPage();
      }, 100);
      return;
    }

    // TODO: replace this with postMessage. This is simply to show the concept in the example tests so far.
    let stringFunction = func.toString();
    let body = stringFunction.substring(stringFunction.indexOf("{") + 1, stringFunction.lastIndexOf("}"));

    let script = document.createElement('script');
    script.innerHTML = body;
    testPageWindow.document.body.append(script);
  }
}

export function verifyATBehavoir(behavior) {
  let newBehavior = behavior;
  newBehavior.commands = getATCommands(behavior.mode[0], behavior.task, at);
  allBehaviors.push(behavior);
}

export function displayTestPageAndInstructions(testPage) {
  if (document.readyState !== 'complete') {
    window.setTimeout(() => {
      displayTestPageAndInstructions(testPage);
    }, 100);
    return;
  }

  testPageWindow = window.open(testPage, '_blank', 'toolbar=0,location=0,menubar=0');

  var style = document.createElement('style');
  style.innerHTML = PAGE_STYLES;
  document.head.appendChild(style);

  if (allBehaviors.length > 0) {
    displayInstructionsForBehaviorTest(0);
  }
}

function displayInstructionsForBehaviorTest(behaviorId) {
  // First, execute necesary set up script in test page
  executeScriptInTestPage();

  const totalBehaviors = allBehaviors.length;
  const behavior = allBehaviors[behaviorId];
  document.body.innerHTML = (TEST_HTML_OUTLINE);

  const mode = behavior.mode[0];
  const modeInstructions = getModeInstructions(mode, at);
  const userInstructions = behavior.specific_user_instruction;
  const commands = behavior.commands;
  const assertions = behavior.assertions;

  let instructionsEl = document.getElementById('instructions');
  instructionsEl.innerHTML = `
<h1 id="behavior-header" tabindex="0">Testing behavior ${behaviorId+1} of ${totalBehaviors}</h1>
<h2>Instructions</h2>
<ol>
  <li><em>${modeInstructions}</em></li>
  <li>Then, <em>${userInstructions}</em> using each of the following <emp>${at}<emp> controls:</li>
  <ul id='at_controls' aria-label='AT controls'>
  </ul>
</ol>
<h2>Success Criteria</h2>
<p>For this test to pass, the following assertions must be met for every possible command:</p>
<ul id='assertions'>
</ul>
`;

  for (let command of commands) {
    let el = document.createElement('li');
    el.innerHTML = `<em>${command}</em>`;
    document.getElementById('at_controls').append(el);
  }

  for (let assertion of assertions) {
    let el = document.createElement('li');
    el.innerHTML = `<em>${assertion}</em>`;
    document.getElementById('assertions').append(el);
  }

  let recordResults = `<h2>Record Results</h2><p>${document.title}</p>`;

  for (let c = 0; c < commands.length; c++) {
    recordResults += `<table id="cmd-${c}" class="record-results">
<tr>
  <td>Results for command: ${commands[c]}</td>
  <td>
    <input type="checkbox" id="allpass-${c}" class="allpass" name="allpass">
    <label for="allpass-${c}">All Pass</label>
  </td>
  <td>
    <input type="checkbox" id="allfail-${c}" class="allfail" name="allfail">
    <label for="allfaill-${c}">All Fail</label>
  </td>
  <td>Last Utterance</td>
  <td>Other Details</td>
</tr>
`;

    for (let a = 0; a < assertions.length; a++) {
      recordResults += `
<tr>
  <td>${assertions[a]}</td>
  <td>
    <input type="checkbox" id="pass-${c}-${a}" class="pass" name="pass-${c}-${a}">
    <label for="pass-${c}-${a}">Pass</label>
  </td>
  <td>
    <input type="checkbox" id="fail-${c}-${a}" class="fail" name="fail-${c}-${a}">
    <label for="fail-${c}-${a}">Fail</label>
  </td>
  <td>
    <input type="text" id="utterance-${c}-${a}">
  </td>
  <td>
    <input type="text" id="info-${c}-${a}">
  </td>
</tr>
`;
    }
  }

  recordResults += '</table>';

  let recordEl = document.getElementById('record-results');
  recordEl.innerHTML = recordResults;

  let checkboxes = document.querySelectorAll('input[type="checkbox"]');
  for (let checkbox of checkboxes) {
    checkbox.onclick = handleCheck;
  }

  // Submit button
  let el = document.createElement('button');
  el.innerText = "Submit";
  el.value = behaviorId;
  el.addEventListener('click', submitResult);
  recordEl.append(el);

  document.querySelector('#behavior-header').focus();
}


function handleCheck(event) {
  let checked = event.target.checked;
  let checkboxId = event.target.id;
  let cmdId = Number(checkboxId.split('-')[1]);

  if (checked && checkboxId.indexOf('allpass') === 0) {
    let passCheckboxes = document.querySelectorAll(`#cmd-${cmdId} .pass`);
    for (let checkbox of passCheckboxes) {
      checkbox.checked = true;
    }
    let failCheckboxes = document.querySelectorAll(`#cmd-${cmdId} .fail`);
    for (let checkbox of failCheckboxes) {
      checkbox.checked = false;
    }
    let allfailCheckbox = document.querySelector(`#cmd-${cmdId} #allfail-${cmdId}`);
    allfailCheckbox.checked = false;
  }

  else if (checked && checkboxId.indexOf('allfail') === 0) {
    let passCheckboxes = document.querySelectorAll(`#cmd-${cmdId} .pass`);
    for (let checkbox of passCheckboxes) {
      checkbox.checked = false;
    }
    let failCheckboxes = document.querySelectorAll(`#cmd-${cmdId} .fail`);
    for (let checkbox of failCheckboxes) {
      checkbox.checked = true;
    }
    let allpassCheckbox = document.querySelector(`#cmd-${cmdId} #allpass-${cmdId}`);
    allpassCheckbox.checked = false;
  }

  else if (checked && checkboxId.indexOf('pass') === 0) {
    let allfailCheckbox = document.querySelector(`#cmd-${cmdId} #allfail-${cmdId}`);
    allfailCheckbox.checked = false;

    let assertionId = Number(checkboxId.split('-')[2]);
    let passCheckbox = document.querySelector(`#cmd-${cmdId} #fail-${cmdId}-${assertionId}`);
    passCheckbox.checked = false;

    let passCheckboxes = document.querySelectorAll(`#cmd-${cmdId} .pass:checked`);
    if (passCheckboxes.length === allBehaviors[currentTestedBehavior].assertions.length) {
      let allpassCheckbox = document.querySelector(`#cmd-${cmdId} #allpass-${cmdId}`);
      allpassCheckbox.checked = true;
    }
  }

  else if (checked && checkboxId.indexOf('fail') === 0) {
    let allpassCheckbox = document.querySelector(`#cmd-${cmdId} #allpass-${cmdId}`);
    allpassCheckbox.checked = false;

    let assertionId = Number(checkboxId.split('-')[2]);
    let passCheckbox = document.querySelector(`#cmd-${cmdId} #pass-${cmdId}-${assertionId}`);
    passCheckbox.checked = false;

    let failCheckboxes = document.querySelectorAll(`#cmd-${cmdId} .fail:checked`);
    if (failCheckboxes.length === allBehaviors[currentTestedBehavior].assertions.length) {
      let allfailCheckbox = document.querySelector(`#cmd-${cmdId} #allfail-${cmdId}`);
      allfailCheckbox.checked = true;
    }
  }
}

function submitResult(event) {
  let assertionResults = [];
  for (let a = 0; a < allBehaviors[currentTestedBehavior].assertions.length; a++) {
    assertionResults.push({pass: [], fail: []});
  }

  for (let c = 0; c <= allBehaviors[currentTestedBehavior].commands.length; c++) {
    let failures = document.querySelectorAll(`#cmd-${c} .fail:checked`);
    for (let failure of failures) {
      let assertionId = Number(failure.id.split('-')[2]);
      assertionResults[assertionId].fail.push({
	cmd: allBehaviors[currentTestedBehavior].commands[c],
	lastUtterance: document.querySelector(`#cmd-${c} #utterance-${c}-${assertionId}`).value,
	otherInfo: document.querySelector(`#cmd-${c} #info-${c}-${assertionId}`).value
      });
    }

    let successes = document.querySelectorAll(`#cmd-${c} .pass:checked`);
    for (let success of successes) {
      let assertionId = Number(success.id.split('-')[2]);
      assertionResults[assertionId].pass.push({
	cmd: allBehaviors[currentTestedBehavior].commands[c],
	lastUtterance: document.querySelector(`#cmd-${c} #utterance-${c}-${assertionId}`).value,
	otherInfo: document.querySelector(`#cmd-${c} #info-${c}-${assertionId}`).value
      });
    }
  }

  let behaviorResults = [];
  let behaviorPassed = 'PASS';
  for (let a = 0; a < assertionResults.length; a++) {
    let assertionResult = assertionResults[a];
    let assertionName = allBehaviors[currentTestedBehavior].assertions[a];
    let status = assertionResult.fail.length === 0 ? 'PASS' : 'FAIL';
    behaviorResults.push({
      name: assertionName,
      status: status,
      details: assertionResult
    });

    behaviorPassed = status === 'FAIL' ? 'FAIL' : 'PASS';
  }

  allBehaviorResults.push({
    status: behaviorPassed,
    assertionResults: behaviorResults,
    task: allBehaviors[currentTestedBehavior].specific_user_instruction
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
  let resulthtml = `<h1>Results for test: ${document.title}</h1><h2 id=overallstatus></h2>`;

  let status = 'PASS';
  for (let result of allBehaviorResults) {
    status = result.status === 'FAIL' ? 'FAIL' : 'PASS';

    resulthtml += `<p>After user task "${result.task}", the following behavior was observed:<p>`;
    resulthtml += `<table>`;
    for (let assertionResult of result.assertionResults) {
      resulthtml += `<tr><td>${assertionResult.status}</td><td>${assertionResult.name}</td>`

      let failingCmds = assertionResult.details.fail.map((f) => f.cmd);
      let passingCmds = assertionResult.details.pass.map((p) => p.cmd);

      resulthtml += '<td><ul>'
      if (failingCmds.length) {
	resulthtml += `<li>Failed for commands: ${failingCmds.join(', ')}.</li>`;
      }
      if (passingCmds.length) {
	resulthtml += `<li>Passed for commands: ${passingCmds.join(', ')}.</li>`;
      }
      resulthtml += '</ul></td>'
      resulthtml += '</tr>'
    }
    resulthtml += `</table>`;
  }

  document.body.innerHTML = resulthtml;
  document.querySelector('#overallstatus').innerHTML = status;

  testPageWindow.close();
}


function showUserError(msg) {
  let errorsEl = document.getElementById('errors');
  errorsEl.style.display = "block";
  let errorMsgEl = document.createElement('p');
  errorMsgEl.innerText = msg;
  errorsEl.append(errorMsgEl);
}

function reportResults(testResults, status) {
  var results_element = document.createElement("script");
  results_element.type = "text/json";
  results_element.id = "__ariaatharness__results__";
  var data = {
    test: document.title,
    tests: testResults,
    status: status.status
  };
  results_element.textContent = JSON.stringify(data);

  document.body.appendChild(results_element);
}
