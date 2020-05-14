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
const support = JSON.parse(fse.readFileSync(path.join(testDir, 'support.json')));
let allATKeys = [];
support.ats.forEach(at => {
	allATKeys.push(at.key);
});

const getPriorityString = function(priority) {
  priority = parseInt(priority);
  if (priority === 1) {
    return 'required';
  }
  else if (priority === 2) {
    return 'optional';
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
    const commAPI = new commandsAPI(commands, support);

    const tests = [];
    fse.readdirSync(subDirFullPath).forEach(function (test) {
      if (path.extname(test) === '.html' && path.basename(test) !== 'index.html') {

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

	let testData = JSON.parse(fse.readFileSync(path.join(subDirFullPath, path.parse(test).name+'.json'), 'utf8'));

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
	  allReleventATs = allATKeys;
	}
	else {
	  allReleventATs = testData.applies_to;
	}

	for (const atKey of allReleventATs.map((a) => a.toLowerCase())) {
	  let commands, assertions;
	  let at = commAPI.isKnownAT(atKey);

	  try {
	    commands = commAPI.getATCommands(mode, task, at);
	  }
	  catch (error) {
	  } // An error will occur if there is no data for a screen reader, ignore it

	  if (testData.additional_assertions && testData.additional_assertions[at.key]) {
	    assertions = testData.additional_assertions[at.key];
	  }
	  else {
	    assertions = testData.output_assertions;
	  }

	  ATTests.push({
	    atName: at.name,
		atKey: at.key,
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
    AToptions: support.ats
  });

  let summaryFile = path.resolve(reviewDir, `${pattern}.html`);
  fse.writeFileSync(summaryFile, rendered);
  console.log(`Summarized ${pattern} tests: ${summaryFile}`);
}

console.log("\n\nDone.");
