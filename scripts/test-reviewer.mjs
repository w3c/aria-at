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
        b: 'build'
    },
});

if (args.help) {
    console.log(`Default use:
  No arguments:
    Generate tests and view report summary.
  Arguments:
    -h, --help
       Show this message.
    -b, --build
       Updates build folder with generated review pages.
`);
    process.exit();
}

const BUILD_CHECK = !!args.build;

const testsDirectory = path.resolve('.', 'tests');
const scriptsDirectory = path.resolve('.', 'scripts');
const reviewDirectory = path.resolve('.', 'review');
const reviewBuildDirectory = path.resolve('build', 'review');

const supportFilePath = path.join(testsDirectory, 'support.json');
const reviewTemplateFilePath = path.resolve(scriptsDirectory, 'review-template.mustache');
const reviewIndexTemplateFilePath = path.resolve(scriptsDirectory, 'review-index-template.mustache');

const allTestsForPattern = {};

const support = JSON.parse(fse.readFileSync(supportFilePath));
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

fse.readdirSync(testsDirectory).forEach(function (subDir) {
    const subDirFullPath = path.join(testsDirectory, subDir);
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
            if (path.extname(test) === '.html' && path.basename(test) !== 'index.html') {

                const testFile = path.join(testsDirectory, subDir, test);
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

                let testData = JSON.parse(fse.readFileSync(path.join(subDirFullPath, path.parse(test).name + '.json'), 'utf8'));

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
                } else {
                    allReleventATs = testData.applies_to;
                }

                for (const atKey of allReleventATs.map((a) => a.toLowerCase())) {
                    let commands, assertions;
                    let at = commAPI.isKnownAT(atKey);

                    try {
                        commands = commAPI.getATCommands(mode, task, at);
                    } catch (error) {
                    } // An error will occur if there is no data for a screen reader, ignore it

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
                const testFilePath = path.join('.', 'tests', subDir, test);
                const output = spawnSync('git', ['log', '-1', '--format="%ad"', testFilePath]);
                const lastEdited = output.stdout.toString().replace(/"/gi, '').replace('\n', '');

                tests.push({
                    testNumber: tests.length + 1,
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

let template = fse.readFileSync(reviewTemplateFilePath, 'utf8');

fs.existsSync(reviewDirectory) || fs.mkdirSync(reviewDirectory);
if (BUILD_CHECK) fs.existsSync(reviewBuildDirectory) || fs.mkdirSync(reviewBuildDirectory);

let indexTemplate = fse.readFileSync(reviewIndexTemplateFilePath, 'utf8');

console.log("\n");

for (let pattern in allTestsForPattern) {

    let rendered = mustache.render(template, {
        pattern: pattern,
        totalTests: allTestsForPattern[pattern].length,
        tests: allTestsForPattern[pattern],
        AToptions: support.ats,
        setupScripts: scripts
    });

    let summaryFile = path.resolve(reviewDirectory, `${pattern}.html`);
    let summaryBuildFile = path.resolve(reviewBuildDirectory, `${pattern}.html`);

    fse.writeFileSync(summaryFile, rendered);
    if (BUILD_CHECK) fse.writeFileSync(summaryBuildFile, rendered);

    console.log(`Summarized ${pattern} tests: ${summaryFile}`);
}

const renderedIndex = mustache.render(indexTemplate, {
    patterns: Object.keys(allTestsForPattern).map(pattern => {
        const lastCommit = spawnSync('git', ['log', '-n1', '--oneline', path.join('.', 'tests', pattern)])
            .stdout
            .toString();
        return {
            name: pattern,
            numberOfTests: allTestsForPattern[pattern].length,
            commit: lastCommit.split(' ')[0],
            commitDescription: lastCommit
        }
    })
});

const indexFileOutputPath = path.resolve('.', 'index.html');
const indexFileBuildOutputPath = path.resolve('build', 'index.html');

fse.writeFileSync(indexFileOutputPath, renderedIndex);
if (BUILD_CHECK) fse.writeFileSync(indexFileBuildOutputPath, renderedIndex);

console.log(`Generated: ${indexFileOutputPath}`);

console.log("\n\nDone.");
