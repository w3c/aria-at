'use strict';
const path = require('path');
const fse = require('fs-extra');
const inquirer = require('inquirer');
const util = require('util');

const ATs = ['jaws', 'voiceover', 'nvda'];
const ATNames = ['JAWS', 'VoiceOver', 'NVDA'];

const getPriorityString = function(priority) {
  priority = parseInt(priority);
  if (priority === 1) {
    return 'required';
  }
  else if (priority === 2) {
    return 'optional';
  }
  return '';
};


const args = require('minimist')(process.argv.slice(2), {
  alias: {
    h: 'help',
    s: 'save'
  },
});

if (args.help) {
  console.log(`
Default use:
  node test-comparer.js a.json b.json
    Will compare results files a.json and b.json
  Arguments:
    -h, --help
       Show this message.
    -s, --save
       Will save results to new file, which will be named: revised-<file1>.json
    -h, --html
       Will write list of difference to an html file name: differences.html
`);
  process.exit();
}

if (! args._.length === 2) {
  console.log("Command expects two json file names as arguments, please supply.");
  process.exit();
}


const SAVE = args.save;
const HTML = args.html;
const resultsFile1 = args._[0];
const resultsFile2 = args._[1];

try {
  fse.statSync(resultsFile1);
  fse.statSync(resultsFile2);
}
catch (err) {
  console.log("One or more results file did not exist. Please use path to existing results file.");
  process.exit();
}

const formatAssertionResult = function(assertion) {
  if (assertion.pass) {
    return `passing: ${assertion.pass}`;
  }
  else if (assertion.fail) {
    return `failing: ${assertion.fail}`;
  }
}

const chooseResult = async function(option1, option2) {
  let answer = await inquirer.prompt([
    {
      type: 'input',
      name: 'result',
      message: `Enter 1 to save the first files answer (${option1}), or enter 2 to save the second files answer (${option2})`,
      validate: function(value) {
	if (parseInt(value) !== 1 && parseInt(value) !== 2) {
	  return 'Please change your answer to "1" or "2"';
	}
        return true;
      }
    }
  ]);
  return parseInt(answer.result) - 1;
}

const compareTests = async function() {
  const results1 = JSON.parse(fse.readFileSync(resultsFile1));
  const results2 = JSON.parse(fse.readFileSync(resultsFile2));
  let htmlDiff = '';

  console.log(`${resultsFile1}: ${results1.designPattern}, ${results1.assistiveTechnology.name} ${results1.assistiveTechnology.version}, ${results1.browser.name} ${results1.browser.version}`);
  console.log(`${resultsFile2}: ${results2.designPattern}, ${results2.assistiveTechnology.name} ${results2.assistiveTechnology.version}, ${results2.browser.name} ${results2.browser.version}`);

  if (
    results1.assistiveTechnology.name !== results2.assistiveTechnology.name
    || results1.browser.name !== results2.browser.name
    || results1.designPattern !== results2.designPattern
  ) {
    console.log("To compare tests, you must have results with the same AT, browers and design pattern.");
    process.exit();
  }


  const combinedResults = {...results1, ...{results: []}};

  const rByTest = [{}, {}];
  results1.results.map(t => {rByTest[0][t.test] = t});
  results2.results.map(t => {rByTest[1][t.test] = t});

  let allTests = new Set(Object.keys(rByTest[0]));
  Object.keys(rByTest[1]).map(t => {allTests.add(t)});

  for (let testName of allTests) {
    const newDetails = {...rByTest[0][testName].details, ...{commands: []}};
    const newTestResult = {...rByTest[0][testName], ...{details: newDetails}};
    let newTestPasses = true;

    const newCommandsList = [];
    const rByCommand = [{}, {}];
    rByTest[0][testName].details.commands.map((c) => rByCommand[0][c.command] = c);
    rByTest[1][testName].details.commands.map((c) => rByCommand[1][c.command] = c);

    let newUnexpectedCount = 0;
    const newSummary = {
      1: {
        pass: 0,
        fail: 0
      },
      2: {
          pass: 0,
        fail: 0
      },
      3: {
        pass: 0,
        fail: 0
      },
    };

    for (let c in rByCommand[0]) {
      const newCommand = {...rByCommand[0][c]};

      const rByAssertion = [{}, {}];
      rByCommand[0][c].assertions.map((a) => rByAssertion[0][a.assertion] = a);
      rByCommand[1][c].assertions.map((a) => rByAssertion[1][a.assertion] = a);

      let newAssertionList = [];
      let newCommandPasses = true;
      let newAssertionResult;
      for (let a in rByAssertion[0]) {

	// Compare the assertion result
	const ar1 = formatAssertionResult(rByAssertion[0][a]);
	const ar2 = formatAssertionResult(rByAssertion[1][a]);
        if (ar1 !== ar2) {

	  console.log(`
Difference in assertion result for test: ${testName}
Instruction: ${rByTest[0][testName].details.specific_user_instruction}
Using Command: ${c}
Testing Assertion: ${a}

Output results recorded:
1. ${formatAssertionResult(rByAssertion[0][a])}
2. ${formatAssertionResult(rByAssertion[1][a])}
`
);

	  htmlDiff += `
<h1>Assertion diff for: ${testName}</h1>
<ul>
  <li>Instruction: ${rByTest[0][testName].details.specific_user_instruction}</li>
  <li>Using Command: ${c}</li>
  <li>Testing Assertion: ${a}</li>
</ul>

<p>Output results recorded:</p>
<ol>
  <li>${formatAssertionResult(rByAssertion[0][a])}</li>
  <li>${formatAssertionResult(rByAssertion[1][a])}</li>
</ol>
`;

          let answer = SAVE
            ? await chooseResult(
              formatAssertionResult(rByAssertion[0][a]),
      	      formatAssertionResult(rByAssertion[1][a]))
            : 0;
	  newAssertionResult = rByAssertion[answer][a];
	}
        else {
  	  // The answers are the same, so just pick on
  	  newAssertionResult = rByAssertion[0][a];
        }

	newAssertionList.push(newAssertionResult);
	if (newAssertionResult.pass) {
	  newSummary[newAssertionResult.priority].pass++;
	}
	else {
	  newTestPasses = false;
	  newCommandPasses = false;
	  newSummary[newAssertionResult.priority].fail++;
	}
      }

      newCommand.assertions = newAssertionList;
      newCommand.support = newCommandPasses ? 'PASSING' : 'FAILING';

      // Compare the unexpected results
      const ub1 = rByCommand[0][c].unexpected_behaviors.length ? rByCommand[0][c].unexpected_behaviors.join('; ') : 'none';
      const ub2 = rByCommand[1][c].unexpected_behaviors.length ? rByCommand[1][c].unexpected_behaviors.join('; ') : 'none';
      if (ub1 !== ub2) {
  	console.log(`Unexpected Behaviors 1: ${ub1}`);
  	console.log(`Unexpected Behaviors 2: ${ub2}`);

	console.log(`
Difference in unexpected results for test: ${testName}
Instruction: ${rByTest[0][testName].details.specific_user_instruction}
Using Command: ${c}

Unexpected behaviors recorded:
1. ${ub1}
2. ${ub2}
`
);

	  htmlDiff += `
<h1>Unexpected results diff for: ${testName}</h1>
<ul>
  <li>Instruction: ${rByTest[0][testName].details.specific_user_instruction}</li>
  <li>Using Command: ${c}</li>
</ul>

<p>Unexpected results recorded:</p>
<ol>
  <li>${ub1}</li>
  <li>${ub2}</li>
</ol>
`;


        if (SAVE) {
          let answer = await chooseResult(ub1, ub2);
	  newCommand.unexpectedBehaviors = rByCommand[answer][c].unexpected_behaviors;
	  newUnexpectedCount += rByCommand[answer][c].unexpected_behaviors.length;
        }
      }
      else {
	newUnexpectedCount += newCommand.unexpected_behaviors.length;
      }

      newCommandsList.push(newCommand);
    }
    newTestResult.details.commands = newCommandsList;
    newTestResult.status = newTestPasses ? 'PASS' : 'FAIL';
    newTestResult.details.summary = newSummary;
    newTestResult.details.unexpectedCount = newUnexpectedCount;
    combinedResults.results.push(newTestResult);
  }

  if (SAVE) {
    fse.writeFileSync(`revised-${results1.assistiveTechnology.name}-${results1.assistiveTechnology.version}-${results1.browser.name}-${results1.browser.version}.json`, JSON.stringify(combinedResults), 'utf8');
  }
  if (HTML) {
    htmlDiff = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>ARIA-AT Test Result Diff for files: ${resultsFile1}, ${resultsFile2}</title>
</head>
<body>
  ${htmlDiff}
</body>
</html>
`;
    fse.writeFileSync(`differences.html`, htmlDiff, 'utf8');
  }
}

compareTests().then(
  () => console.log("Success!"),
  (err) => console.log(err)
);
