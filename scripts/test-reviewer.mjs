import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import {spawnSync} from 'child_process';
import np from 'node-html-parser';
import mustache from 'mustache';
import minimist from 'minimist';
import {commandsAPI} from '../tests/resources/at-commands.mjs';

const args = minimist(process.argv.slice(2), {
    alias: {
        h: 'help',
        d: 'directory'
    },
});

if (args.help) {
    console.log(`Default use:
  No arguments:
    Generate review pages.
  Arguments:
    -h, --help
       Show this message.
    -d, --directory
       Generate review page for an individual test plan directory. eg. --directory=checkbox
`);
    process.exit();
}

const TARGET_DIRECTORY = args.directory; // individual test plan to generate review page assets for

// folders and file paths setup
const buildDirectory = path.resolve('.', 'build');
const testsDirectory = path.resolve('.', 'tests');
const scriptsDirectory = path.resolve('.', 'scripts');
const testsBuildDirectory = path.resolve(buildDirectory, 'tests');
const reviewBuildDirectory = path.resolve(buildDirectory, 'review');

const indexFileBuildOutputPath = path.resolve(buildDirectory, 'index.html');
const metaOutputFilePath = path.resolve(buildDirectory, 'meta.json');
const supportFilePath = path.join(testsDirectory, 'support.json');
const reviewTemplateFilePath = path.resolve(scriptsDirectory, 'review-template.mustache');
const reviewIndexTemplateFilePath = path.resolve(scriptsDirectory, 'review-index-template.mustache');

// create directories if not exists
fs.existsSync(reviewBuildDirectory) || fs.mkdirSync(reviewBuildDirectory);

const allTestsForPattern = {};
const support = JSON.parse(fse.readFileSync(supportFilePath));
const meta = fse.existsSync(metaOutputFilePath) ? JSON.parse(fse.readFileSync(metaOutputFilePath)) : []; // default to empty array if not exists

let allATKeys = [];
support.ats.forEach(at => {
    allATKeys.push(at.key);
});

const scripts = [];

const getPriorityString = function (priority) {
    priority = parseInt(priority);
    if (priority === 1) {
        return 'required';
    } else if (priority === 2) {
        return 'optional';
    }
    return '';
}

fse.readdirSync(testsDirectory).forEach(function (directory) {
    const testPlanDirectory = path.join(testsDirectory, directory);
    const testPlanBuildDirectory = path.join(testsBuildDirectory, directory);
    const stat = fse.statSync(testPlanDirectory);

    if (stat.isDirectory() && directory !== 'resources') {
        // Initialize the commands API
        const commandsJSONFile = path.join(testPlanBuildDirectory, 'commands.json');
        const commands = JSON.parse(fse.readFileSync(commandsJSONFile));
        const commAPI = new commandsAPI(commands, support);

        const tests = [];

        const referencesCsv = fs.readFileSync(path.join(testPlanDirectory, 'data', 'references.csv'), 'UTF-8');
        const reference = referencesCsv.split(/\r?\n/).find(s => s.startsWith('reference,')).split(',')[1];

        const scriptsPath = path.join(testPlanDirectory, 'data', 'js');
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

        fse.readdirSync(testPlanBuildDirectory).forEach(function (test) {
            if (path.extname(test) === '.html' && path.basename(test) !== 'index.html') {
                const testFile = path.join(testsBuildDirectory, directory, test);
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
                        } else {
                            text = `APG example: ${href.split('examples/')[1]}`;
                        }

                        helpLinks.push({
                            link: href,
                            text: text
                        });
                    }
                }

                let testData = JSON.parse(fse.readFileSync(path.join(testPlanBuildDirectory, path.parse(test).name + '.json'), 'utf8'));

                const userInstruction = testData.specific_user_instruction;
                const task = testData.task;

                // This is temporary while transitioning from lists to strings
                const mode = typeof testData.mode === 'string' ? testData.mode : testData.mode[0];

                const ATTests = [];

                // TODO: These apply_to strings are not standardized yet.
                let allRelevantATs = [];
                if (
                    testData.applies_to[0].toLowerCase() === "desktop screen readers"
                    || testData.applies_to[0].toLowerCase() === "screen readers"
                ) {
                    allRelevantATs = allATKeys;
                } else {
                    allRelevantATs = testData.applies_to;
                }

                for (const atKey of allRelevantATs.map((a) => a.toLowerCase())) {
                    let commands, assertions;
                    let at = commAPI.isKnownAT(atKey);

                    try {
                        commands = commAPI.getATCommands(mode, task, at);
                    } catch (error) { // An error will occur if there is no data for a screen reader, ignore it
                    }

                    if (testData.additional_assertions && testData.additional_assertions[at.key]) {
                        assertions = testData.additional_assertions[at.key];
                    } else {
                        assertions = testData.output_assertions;
                    }

                    ATTests.push({
                        atName: at.name,
                        atKey: at.key,
                        commands: commands && commands.length ? commands : undefined,
                        assertions: assertions && assertions.length ? assertions.map(a => ({
                            priority: getPriorityString(a[0]),
                            description: a[1]
                        })) : undefined,
                        userInstruction,
                        modeInstruction: commAPI.getModeInstructions(mode, at),
                        setupScriptDescription: testData.setup_script_description,
                    });
                }

                // Create the test review pages
                const testFilePath = path.join(testsBuildDirectory, directory, test);
                const output = spawnSync('git', ['log', '-1', '--format="%ad"', testFilePath]);
                const lastEdited = output.stdout.toString().replace(/"/gi, '').replace('\n', '');

                tests.push({
                    testNumber: tests.length + 1,
                    name: testFullName,
                    location: `/${directory}/${test}`,
                    reference: `/${directory}/${reference}`,
                    allRelevantATsFormatted: testData.applies_to.join(', '),
                    allRelevantATs: testData.applies_to,
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
            allTestsForPattern[directory] = tests;
        }
    }
});

let template = fse.readFileSync(reviewTemplateFilePath, 'utf8');
let indexTemplate = fse.readFileSync(reviewIndexTemplateFilePath, 'utf8');

const generateTestPlanReviewIndex = pattern => {
    let rendered = mustache.render(template, {
        pattern: pattern,
        totalTests: allTestsForPattern[pattern].length,
        tests: allTestsForPattern[pattern],
        AToptions: support.ats,
        setupScripts: scripts
    });

    let summaryBuildFile = path.resolve(reviewBuildDirectory, `${pattern}.html`);
    fse.writeFileSync(summaryBuildFile, rendered);

    console.log(`Summarized ${pattern} tests: ${summaryBuildFile}`);
}

if (TARGET_DIRECTORY) {
    if (allTestsForPattern[TARGET_DIRECTORY]) generateTestPlanReviewIndex(TARGET_DIRECTORY);
    else { // most likely to happen if incorrect directory specified
        console.error('ERROR: Unable to find valid test plan(s).');
        process.exit();
    }
} else {
    for (let pattern in allTestsForPattern) generateTestPlanReviewIndex(pattern);
}

const renderedIndex = mustache.render(indexTemplate, {
    patterns: Object.keys(allTestsForPattern).map(pattern => {
        const lastCommit = spawnSync('git', ['log', '-n1', '--oneline', path.join('.', 'tests', pattern)])
            .stdout
            .toString();

        const result = {
            name: pattern,
            numberOfTests: allTestsForPattern[pattern].length,
            commit: lastCommit.split(' ')[0],
            commitDescription: lastCommit
        };

        if (TARGET_DIRECTORY) {
            // check to see if exists in the meta history
            const targetTestPlanIndex = meta.findIndex(metaTestPlan => metaTestPlan.name === result.name && metaTestPlan.name === TARGET_DIRECTORY);
            if (targetTestPlanIndex >= 0) {
                if (meta[targetTestPlanIndex].commit === result.commit) {
                    // Do nothing because version of test plan is unchanged
                } else meta[targetTestPlanIndex] = {...result};
            } else { // account for any possible upserts
                const testPlanFound = meta.some(testPlan => testPlan.name === result.name && testPlan.commit === result.commit);
                if (!testPlanFound) meta.push(result);
            }
        } else {
            const testPlanIndex = meta.findIndex(metaTestPlan => metaTestPlan.name === result.name && metaTestPlan.commit === result.commit);
            if (testPlanIndex >= 0) {
                if (meta[testPlanIndex].commit === result.commit) {
                    // Do nothing because version of test plan is unchanged
                } else meta[testPlanIndex] = {...result};
            } else meta.push(result);
        }

        return result;
    })
});

fse.writeFileSync(indexFileBuildOutputPath, renderedIndex);
fse.writeFileSync(metaOutputFilePath, JSON.stringify(meta, null, 2), 'utf8');

console.log(`\nGenerated index.html: ${indexFileBuildOutputPath}`);
console.log("\nDone.");
