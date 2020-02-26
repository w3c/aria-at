import path from 'path';
import fse from 'fs-extra';
import htmlparser2 from 'htmlparser2';
import { spawnSync } from 'child_process';
import np from 'node-html-parser';
import mustache from 'mustache';
import { commandsAPI } from '../tests/resources/at-commands.mjs';
import * as keys from '../tests/resources/keys.mjs';

const testDir = path.resolve('.', 'tests');
const templateFile = path.resolve('.', 'scripts', 'review-template.mustache');
const reviewDir = path.resolve('.', 'public', 'review');
const allTestsForPattern = {};
const ATs = ['jaws', 'voiceover', 'nvda'];
const ATNames = ['JAWS', 'VoiceOver', 'NVDA'];
const getPriorityString = function(priority) {
  priority = parseInt(priority);
  if (priority === 1) {
    return 'must have';
  }
  else if (priority === 2) {
    return 'should have';
  }
  else if (priority === 2) {
    return 'nice to have';
  }
  return '';
}

fse.readdirSync(testDir).forEach(function (subDir) {
  const subDirFullPath = path.join(testDir, subDir);
  const stat = fse.statSync(subDirFullPath);
  if (
    stat.isDirectory() &&
    subDir !== 'resources'
  ) {

    // Initialize the commands API
    const commandsJSONFile = path.join(subDirFullPath, 'commands.json');
    const commands = JSON.parse(fse.readFileSync(commandsJSONFile));
    const commAPI = new commandsAPI(commands);

    const tests = [];
    fse.readdirSync(subDirFullPath).forEach(function (test) {
      if (path.extname(test) === '.html') {

	const testFile = path.join(testDir, subDir, test);
	const root = np.parse(fse.readFileSync(testFile, 'utf8'), {script: true});

	// Get metadata
	const testFullName = root.querySelector('title').innerHTML;
	const helpLinks = [];
	for (let link of root.querySelectorAll('link')) {
	  if (link.attributes.rel === 'help') {
	    let href = link.attributes.href;
	    let text;
	    if (href.indexOf('#') >= 0) {
	      text = `ARIA specification: ${href.split('#')[1]}`;
	    }
	    else {
	      text = `APG example: ${href.split('examples/')[1]}`;
	    }

	    helpLinks.push({
	      link: href,
	      text: text
	    });
	  }
	}

	// Get data for declarative tests
	const jsString = root.querySelector('script').innerHTML;
        const re = /verifyATBehavior\({([\w\W]+)}\);/g;
        const match = re.exec(jsString);
        const verifyATBehaviorArgument = match[1];

	if (!verifyATBehaviorArgument) {
	  throw("Cannot match verifyATBehavior arguments for file: ", test);
	}

        let testData;
        eval('testData = {' + verifyATBehaviorArgument + '}');

	const userInstruction = testData.specific_user_instruction;
	const task = testData.task;

	// This is temporary while transitioning from lists to strings
	const mode = typeof testData.mode === 'string' ? testData.mode : testData.mode[0];

	const ATTests = [];

	// TODO: These apply_to strings are not standarized yet.
	let allReleventATs = [];
	if (
          testData.applies_to[0].toLowerCase() === "desktop screen readers"
          || testData.applies_to[0].toLowerCase() === "screen readers"
        ) {
	  allReleventATs = ATs;
	}
	else {
	  allReleventATs = testData.applies_to;
	}

	for (const at of allReleventATs.map((a) => a.toLowerCase())) {
	  let commands, assertions;

	  try {
	    commands = commAPI.getATCommands(mode, task, at);
	  }
	  catch (error) {
	  } // An error will occur if there is no data for a screen reader, ignore it

	  if (testData.additional_assertions && testData.additional_assertions[at]) {
	    assertions = testData.additional_assertions[at];
	  }
	  else {
	    assertions = testData.output_assertions;
	  }

	  let properAT = commAPI.isKnownAT(at);

	  ATTests.push({
	    atName: properAT,
	    commands: commands && commands.length ? commands : undefined,
	    assertions: assertions && assertions.length ? assertions.map(a => ({ priority: getPriorityString(a[0]), description: a[1] })) : undefined,
	    userInstruction,
	    modeInstruction: commAPI.getModeInstructions(mode, at),
	    setupScriptDescription: testData.setup_script_description
	  });
	}

	// Create the test review pages
	const testFilePath = path.join('.', 'tests', subDir, test);
	const output = spawnSync('git', ['log', '-1', '--format="%ad"', testFilePath]);
	const lastEdited = output.stdout.toString().replace(/"/gi, '');

	tests.push({
	  testNumber: tests.length+1,
	  name: testFullName,
	  location: `/${subDir}/${test}`,
	  allReleventATs: testData.applies_to.join(', '),
	  task,
	  mode,
	  ATTests,
	  helpLinks,
	  lastEdited
	});
      }
    });

    if (tests.length) {
      allTestsForPattern[subDir] = tests;
    }
  }
});

var template = fse.readFileSync(templateFile, 'utf8');
if (!fse.existsSync(reviewDir)){
    fse.mkdirSync(reviewDir);
}

console.log("\n");

for (let pattern in allTestsForPattern) {

  var rendered = mustache.render(template, {
    pattern: pattern,
    totalTests: allTestsForPattern[pattern].length,
    tests: allTestsForPattern[pattern],
    AToptions: ATNames
  });

  let summaryFile = path.resolve(reviewDir, `${pattern}.html`);
  fse.writeFileSync(summaryFile, rendered);
  console.log(`Summarized ${pattern} tests: ${summaryFile}`);
}

console.log("\n\nDone.");
