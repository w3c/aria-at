import {isKnownAT, getATCommands, getModeInstructions} from './at-commands.mjs';

const DEFAULT_AT = 'jaws';
const DEFAULT_RESULTS = ['Success', 'Complete Failure', 'Partial Failure'];

const TEST_HTML_OUTLINE = `
<section id='errors' style='display:none'><h2>Test cannot be performed due to loading error(s).</h2></section>
<section id='instructions'></section>
<section id='record-results'>
</section>
<section id='submit-results'>
</section>
`;

let handleResult;

export function openTestPage(page) {
  console.log(`TODO: open ${page}`);
}

export function executeScriptInTestPage(page) {
  console.log(`TODO: execute script in page.`);
}

export function presentATTest(test) {
  let title = document.title;
  document.open();
  document.write(TEST_HTML_OUTLINE);
  document.close();
  document.title = title;

  let at = DEFAULT_AT;
  const mode = test.mode[0];
  const modeInstructions = getModeInstructions(mode, at);
  const userInstructions = test.specific_user_instruction;
  const commands = getATCommands(mode, test.task, at);
  const assertions = test.assertions;
  const testResultsObject = {};
  for (let assertion of assertions) {
    testResultsObject[assertion] = true;
  }

  if (window.location.hash) {
    let requestedAT = window.location.hash.slice(1);
    if (isKnownAT(requestedAT)) {
      at = requestedAT;
    }
    else {
      showUserError(`Harness does not have commands for the requested assistive technology ('${requestedAT}'), showing commands for assitive technology '${DEFAULT_AT}' instead. To test '${requestedAT}', please contribute command mappings to this project.`);
    }
  }

  let instructionsEl = document.getElementById('instructions');
  instructionsEl.innerHTML = `
<h2>Test Instructions</h2>
<ol>
  <li>${modeInstructions}.</li>
  <li>Then, ${userInstructions} using each of the following ${at} controls:</li>
  <ul id='at_controls' aria-label='AT controls'>
  </ul>
</ol>
<h2>Test Success Criteria</h2>
<p>For this test to pass, the following assertions must be met for every possible command:</p>
<ul id='assertions'>
</ul>
`;

  for (let command of commands) {
    let el = document.createElement('li');
    el.innerText = command;
    document.getElementById('at_controls').append(el);
  }

  for (let assertion of assertions) {
    let el = document.createElement('li');
    el.innerText = assertion;
    document.getElementById('assertions').append(el);
  }

  handleResult = (result) => function () {
    let testResultsList = [];

    if ( result === 'Success') {
      let cmds = commands.join(", ");
      for (let assertion of assertions) {
	testResultsList.push({
	  test: assertion,
	  status: 'pass',
	  message: `Tested ${at} commands: ${cmds}`
	});
      }
      displayResults(testResultsList, 'pass');
    }
    if (result === 'Complete Failure') {
      let cmds = commands.join(", ");
      for (let assertion of assertions) {
	testResultsList.push({
	  test: assertion,
	  status: 'fail',
	  message: `Tested ${at} commands: ${cmds}`
	});
      }
      displayResults(testResultsList, 'fail');
    }
    if (result === 'Partial Failure') {
      displayStructuredFailure(assertions, commands);
    }
  };


  let resultsEl = document.getElementById('record-results');
  for (let result of DEFAULT_RESULTS) {
    let el = document.createElement('button');
    el.innerText = result;
    el.addEventListener('click', handleResult(result));
    resultsEl.append(el);
  }

};

function displayResults(testResults, status) {

  let structuredResults = `
<h4>Review the following test results for submission:</h4>
<p>${status.toUpperCase()}: ${document.title}<p>
<table>
  <tr>
    <th>Status</th>
    <th>Assertion</th>
    <th>Details</th>
  </tr>
`;

  for (let result of testResults) {
    structuredResults += `
  <tr>
    <td>${result.status}</td>
    <td>${result.test}</td>
    <td>${result.message}</td>
  </tr>
`
  }

  structuredResults += `
</table>
<button>Submit</button>
`

  let submitEl = document.getElementById('submit-results');
  submitEl.innerHTML = structuredResults;
}

// TODO: save state when changing between buttons
function displayStructuredFailure(assertions, commands) {
  let structuredResults = `<h4>To record a partial failure, mark commands as failing and supply failing utterance</h4><p>PARTIAL FAILURE: ${document.title}</p>`;

  structuredResults += '<table>';

  let i = 0;
  for (let assertion of assertions) {
    structuredResults += `<tr><td colspan="2"><b>Failures for assertion:</b> ${assertion}</td></tr>`;
    for (let cmd of commands) {
    structuredResults += `
<tr>
  <td>
    <input type="checkbox" id="${cmd}--${i}" name="${cmd}--${i}">
    <label for="${cmd}--${i}">${cmd}</label>
  </td>
  <td>
    <input type="text" id="utterance--${cmd}--${i}" placeholder="Last utterance">
  </td>
</tr>
`;
    }
    i++;
  }

  structuredResults += '</table><button>Submit</button>'

  let submitEl = document.getElementById('submit-results');
  submitEl.innerHTML = structuredResults;


  // TODO: onclick handler that "submits" results
  let testResults = [];

}

function showUserError(msg) {
  let errorsEl = document.getElementById('errors');
  errorsEl.style.display = "block";
  let errorMsgEl = document.createElement('p');
  errorMsgEl.innerText = msg;
  errorsEl.append(errorMsgEl);
}

function dump_test_results(testResults, status) {
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
