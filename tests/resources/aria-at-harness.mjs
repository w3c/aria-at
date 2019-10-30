import {isKnownAT, getATCommands, getModeInstructions} from './at-commands.mjs';

const DEFAULT_AT = 'JAWS';
const DEFAULT_RESULTS = ['All Pass', 'All Fail', 'Some Fail'];

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
      at = isKnownAT(requestedAT);
    }
    else {
      showUserError(`Harness does not have commands for the requested assistive technology ('${requestedAT}'), showing commands for assitive technology '${DEFAULT_AT}' instead. To test '${requestedAT}', please contribute command mappings to this project.`);
    }
  }

  let instructionsEl = document.getElementById('instructions');
  instructionsEl.innerHTML = `
<h2>Test Instructions</h2>
<ol>
  <li><em>${modeInstructions}</em></li>
  <li>Then, <em>${userInstructions}</em> using each of the following <emp>${at}<emp> controls:</li>
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
    el.innerHTML = `<em>${command}</em>`;
    document.getElementById('at_controls').append(el);
  }

  for (let assertion of assertions) {
    let el = document.createElement('li');
    el.innerHTML = `<em>${assertion}</em>`;
    document.getElementById('assertions').append(el);
  }

  handleResult = (result) => function () {
    let testResultsList = [];

    if ( result === 'All Pass') {
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
    if (result === 'All Fail') {
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
    if (result === 'Some Fail') {
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

function displayStructuredFailure(assertions, commands) {
  // TODO: save state when changing between buttons
  // This should operate like a tab

  let structuredResults = `<h4>To record a partial failure, mark commands as failing and supply failing utterance</h4><p>PARTIAL FAILURE: ${document.title}</p>`;

  structuredResults += '<table>';

  let i = 0;
  for (let assertion of assertions) {
    structuredResults += `<tr><td colspan="2">Failures for assertion: ${assertion}</td></tr>`;
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


  // TODO: onclick handler that "submits" results to call "reportResults"
  let testResults = [];

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
