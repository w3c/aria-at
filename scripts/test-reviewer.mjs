import path from 'path';
import fse from 'fs-extra';
import htmlparser2 from 'htmlparser2';
import { spawnSync } from 'child_process';
import np from 'node-html-parser';
import mustache from 'mustache';
import { getATCommands, getModeInstructions, isKnownAT } from '../tests/resources/at-commands.mjs';
import * as keys from '../tests/resources/keys.mjs';

const testDir = path.resolve('.', 'tests');
const templateFile = path.resolve('.', 'scripts', 'review-template.mustache');
const reviewDir = path.resolve('.', 'public', 'review');
const allTestsForPattern = {};
const SRs = ['jaws', 'voiceover', 'nvda'];

fse.readdirSync(testDir).forEach(function (subDir) {
  const subDirFullPath = path.join(testDir, subDir);
  const stat = fse.statSync(subDirFullPath);
  if (
    stat.isDirectory() &&
    subDir !== 'resources'
  ) {
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
	    helpLinks.push(link.attributes.href);
	  }
	}

	for (let help of root.querySelectorAll('link[rel="help"]')) {
	  console.log(help.attributes.href);
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
	const mode = testData.mode[0];
	const SRTests = [];

	const allReleventSRs = [];
	for (const sr of SRs) {
	  let commands, assertions;

	  if (testData.additional_assertions && testData.additional_assertions[sr]) {
	    commands = testData.additional_assertions[sr].keys;
	    assertions = testData.additional_assertions[sr].keys;
	  }
	  else {
	    try {
	      commands = getATCommands(mode, task, sr);
	    }
	    catch (error) {
	    } // An error will occur if there is no data for a screen reader, ignore it

	    assertions = testData.output_assertions;
	  }

	  if (commands && commands.length) {
	    let properSR = isKnownAT(sr);
	    allReleventSRs.push(properSR);

	    SRTests.push({
	      sr: properSR,
	      commands: commands,
	      assertions: assertions.map(a => ({ priority: a[0], description: a[1] })),
	      userInstruction,
	      modeInstruction: getModeInstructions(mode, sr)
	    });
	  }

	}

	tests.push({
	  testNumber: tests.length+1,
	  name: testFullName,
	  location: `/${subDir}/${test}`,
	  allReleventSRs: allReleventSRs.join(', '),
	  task,
	  mode,
	  SRTests,
	  helpLinks
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
    tests: allTestsForPattern[pattern]
  });

  let summaryFile = path.resolve(reviewDir, `${pattern}.html`);
  fse.writeFileSync(summaryFile, rendered);
  console.log(`Summarized ${pattern} tests: ${summaryFile}`);
}

console.log("\n\nDone.");
