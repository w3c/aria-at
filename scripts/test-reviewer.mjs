import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import htmlparser2 from 'htmlparser2';
import { spawnSync } from 'child_process';
import np from 'node-html-parser';
import mustache from 'mustache';
import { commandsAPI } from '../tests/resources/at-commands.mjs';
import * as keys from '../tests/resources/keys.mjs';

const testDir = path.resolve('.', 'tests');
const templateFile = path.resolve('.', 'scripts', 'review-template.mustache');
const templateIndexFile = path.resolve('.', 'scripts', 'review-index-template.mustache');
const reviewDir = path.resolve('.', 'review');
const allTestsForPattern = {};
const support = JSON.parse(fse.readFileSync(path.join(testDir, 'support.json')));
let allATKeys = [];
let testDate = [];
let lastEdited;
support.ats.forEach(at => {
	allATKeys.push(at.key);
});
const scripts = [];

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

    const referencesCsv = fs.readFileSync(path.join(subDirFullPath, 'data', 'references.csv'), 'UTF-8');
    const reference = referencesCsv.split(/\r?\n/).find(s => s.startsWith('reference,')).split(',')[1];

    const scriptsPath = path.join(subDirFullPath, 'data', 'js');
    fse.readdirSync(scriptsPath).forEach(function (scriptFile) {
      let script = '';
      try {
        const data = fs.readFileSync(path.join(scriptsPath, scriptFile), 'UTF-8');
        const lines = data.split(/\r?\n/);
        lines.forEach((line) => {
          if (line.trim().length)
            script += '\t' + line.trim() + '\n';
        });
      } catch (err) {
        console.error(err);
      }
      scripts.push(`\t${scriptFile.split('.js')[0]}: function(testPageDocument){\n${script}}`);
    });

    fse.readdirSync(subDirFullPath).forEach(function (test) {
    	// DW - I think this is where we check the tests originally of all html files aother than index
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
	    setupScriptDescription: testData.setup_script_description,
	  });
	}

	debugger;

	// Create the test review pages

	//const testFilePath = path.join('.', 'tests', subDir, test);


  	let dateCompare = function(a,b) {
  		return(
  			isFinite(a=a.valueOf()) &&
            isFinite(b=b.valueOf()) ?
            (a>b)-(a<b) :
            NaN
		)
  	}


	// only check the file path for the first test
  if (test.includes('test-01')) {
	const checkDataFilePath = path.join('.', 'tests', subDir, 'data');
	const outputData = spawnSync('git', ['log', '-1', '--format="%ad"', checkDataFilePath]);
	const lastDataEdited = new Date(outputData.stdout.toString().replace(/"/gi, '').replace('\n', ''));

	const checkReferenceFilePath = path.join('.', 'tests', subDir, 'reference');
	const outputReference = spawnSync('git', ['log', '-1', '--format="%ad"', checkReferenceFilePath]);
	const lastReferenceEdited = new Date(outputReference.stdout.toString().replace(/"/gi, '').replace('\n', ''));

	  if (dateCompare(lastReferenceEdited, lastDataEdited) === 1 ){
		lastEdited = lastReferenceEdited;
	  } else {
		lastEdited = lastDataEdited;
	  }
  }

	tests.push({
	  testNumber: tests.length+1,
	  name: testFullName,
	  location: `/${subDir}/${test}`,
          reference: `/${subDir}/${reference}`,
	  allReleventATsFormatted: testData.applies_to.join(', '),
	  allReleventATs: testData.applies_to,
          setupScriptName: testData.setupTestPage,
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

var indexTemplate = fse.readFileSync(templateIndexFile, 'utf8');

console.log("\n");

for (let pattern in allTestsForPattern) {

  var rendered = mustache.render(template, {
    pattern: pattern,
    totalTests: allTestsForPattern[pattern].length,
    tests: allTestsForPattern[pattern],
    AToptions: support.ats,
    setupScripts: scripts
  });

  let summaryFile = path.resolve(reviewDir, `${pattern}.html`);
  fse.writeFileSync(summaryFile, rendered);
  console.log(`Summarized ${pattern} tests: ${summaryFile}`);
}

const renderedIndex = mustache.render(indexTemplate, {
  patterns: Object.keys(allTestsForPattern).map(pattern => {
    const lastCommit = spawnSync('git', ['log', '-n1', '--oneline', path.join('.', 'tests', pattern)]).stdout.toString();
    return {
      name: pattern,
      numberOfTests: allTestsForPattern[pattern].length,
      commit: lastCommit.split(' ')[0],
      commitDescription: lastCommit
    }
  })
});
const indexFile = path.resolve('.', 'index.html');
fse.writeFileSync(indexFile, renderedIndex);
console.log(`Generated: ${indexFile}`);

console.log("\n\nDone.");
