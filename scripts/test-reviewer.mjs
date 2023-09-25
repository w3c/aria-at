import path from 'path';
import fse from 'fs-extra';
import { spawnSync } from 'child_process';
import np from 'node-html-parser';
import mustache from 'mustache';
import minimist from 'minimist';
import { commandsAPI as CommandsAPI } from '../tests/resources/at-commands.mjs';

const args = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    t: 'testplan',
  },
});

if (args.help) {
  console.log(`Default use:
  No arguments:
    Generate review pages.
  Arguments:
    -h, --help
       Show this message.
    -t, --testplan
       Generate review page for an individual test plan directory. eg. --testplan=checkbox
`);
  process.exit();
}

// on some OSes, it seems the `npm_config_testplan` environment variable will come back as the actual variable name rather than empty if it does not exist
const TARGET_TEST_PLAN =
  args.testplan && !args.testplan.includes('npm_config_testplan') ? args.testplan : null; // individual test plan to generate review page assets for

// folders and file paths setup
const buildDirectory = path.resolve('.', 'build');
const testsDirectory = path.resolve('.', 'tests');
const scriptsDirectory = path.resolve('.', 'scripts');
const testsBuildDirectory = path.resolve(buildDirectory, 'tests');
const reviewBuildDirectory = path.resolve(buildDirectory, 'review');

const indexFileBuildOutputPath = path.resolve(buildDirectory, 'index.html');
const supportFilePath = path.join(testsDirectory, 'support.json');
const reviewTemplateFilePath = path.resolve(scriptsDirectory, 'review-template.mustache');
const reviewIndexTemplateFilePath = path.resolve(
  scriptsDirectory,
  'review-index-template.mustache'
);

// create directories if not exists
fse.existsSync(reviewBuildDirectory) || fse.mkdirSync(reviewBuildDirectory);

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
    return 'MUST';
  } else if (priority === 2) {
    return 'SHOULD';
  } else if (priority === 3) {
    return 'MAY'
  }
  return '';
};

// TODO: If TARGET_TEST_PLAN is set, only check that directory
fse.readdirSync(testsDirectory).forEach(function (directory) {
  const testPlanDirectory = path.join(testsDirectory, directory);
  const testPlanBuildDirectory = path.join(testsBuildDirectory, directory);
  const stat = fse.statSync(testPlanDirectory);

  if (stat.isDirectory() && directory !== 'resources' && (TARGET_TEST_PLAN ? directory === TARGET_TEST_PLAN : true)) {
    // Initialize the commands API
    const commandsJSONFile = path.join(testPlanBuildDirectory, 'commands.json');
    const commands = JSON.parse(fse.readFileSync(commandsJSONFile));
    const commandsAPI = new CommandsAPI(commands, support);

    const tests = [];

    const referencesCsv = fse.readFileSync(
      path.join(testPlanDirectory, 'data', 'references.csv'),
      'UTF-8'
    );
    const lines = referencesCsv.trim().split(/\r?\n/);
    const headers = lines[0].split(',');
    const referencesCsvData = lines.slice(1).map(line => line.split(','));

    let referencesData = referencesCsvData.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    const { references: { aria, htmlAam } } = support;
    referencesData = referencesData.map(({ refId: _refId, type: _type, value: _value, linkText: _linkText }) => {
      let refId = _refId.trim();
      let type = _type.trim();
      let value = _value.trim();
      let linkText = _linkText.trim();

      if (type === 'aria') {
        value = `${aria.baseUrl}${aria.fragmentIds[value]}`;
        linkText = `${linkText} ${aria.linkText}`;
      }

      if (type === 'htmlAam') {
        value = `${htmlAam.baseUrl}${htmlAam.fragmentIds[value]}`;
        linkText = `${linkText} ${htmlAam.linkText}`;
      }

      return {refId, type, value, linkText}
    });

    const reference = referencesData.find(({ refId }) => refId === 'reference');
    const title = referencesData.find(({ refId }) => refId === 'title');

    // const referenceLine = referencesCsv.split(/\r?\n/).find(s => s.startsWith('reference,'));
    // const splitReferenceLine = referenceLine ? referenceLine.split(',') : null;
    // const reference = splitReferenceLine && splitReferenceLine.length > 1 && splitReferenceLine[2];

    if (!reference) {
      // force exit if file path reference not found
      console.error(
        `ERROR: 'reference' value path defined in "tests/${directory}/data/references.csv" not found.`
      );
      process.exit(1);
    }

    console.log('reference', reference, referencesCsv, referencesData)

    const scriptsPath = path.join(testPlanDirectory, 'data', 'js');
    fse.readdirSync(scriptsPath).forEach(function (scriptFile) {
      let script = '';
      try {
        const data = fse.readFileSync(path.join(scriptsPath, scriptFile), 'UTF-8');
        const lines = data.split(/\r?\n/);
        lines.forEach(line => {
          if (line.trim().length) script += '\t' + line.trim() + '\n';
        });
      } catch (err) {
        console.error(err);
      }
      scripts.push(`\t${scriptFile.split('.js')[0]}: function(testPageDocument){\n${script}}`);
    });

    fse.readdirSync(testPlanBuildDirectory).forEach(function (test) {
      if (
        path.extname(test) === '.html' &&
        !/\.collected\.html$/.test(test) &&
        path.basename(test) !== 'index.html'
      ) {
        const testFile = path.join(testsBuildDirectory, directory, test);
        const root = np.parse(fse.readFileSync(testFile, 'utf8'), { script: true });

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
              text: text,
            });
          }
        }

        let testData = JSON.parse(
          fse.readFileSync(
            path.join(testPlanBuildDirectory, path.parse(test).name + '.json'),
            'utf8'
          )
        );

        const userInstruction = testData.specific_user_instruction;
        const task = testData.task;

        // This is temporary while transitioning from lists to strings
        const mode = typeof testData.mode === 'string' ? testData.mode : testData.mode[0];

        const ATTests = [];

        // TODO: These apply_to strings are not standardized yet.
        let allRelevantATs = [];
        if (
          testData.applies_to[0].toLowerCase() === 'desktop screen readers' ||
          testData.applies_to[0].toLowerCase() === 'screen readers'
        ) {
          allRelevantATs = allATKeys;
        } else {
          allRelevantATs = testData.applies_to;
        }

        for (const atKey of allRelevantATs.map(a => a.toLowerCase())) {
          let commands, assertions;
          let at = commandsAPI.isKnownAT(atKey);

          try {
            commands = commandsAPI.getATCommands(mode, task, at);
          } catch (error) {
            // An error will occur if there is no data for a screen reader, ignore it
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
            assertions:
              assertions && assertions.length
                ? assertions.map(a => {
                  if (Array.isArray(a)) {
                    return {
                      priority: getPriorityString(a[0]),
                      description: a[1]
                    };
                  }

                  return {
                    priority: getPriorityString(a.priority),
                    description: a.assertionStatement
                  }
                })
                : undefined,
            userInstruction,
            modeInstruction: commandsAPI.getModeInstructions(mode, at),
            setupScriptDescription: testData.setup_script_description,
          });
        }

        // Create the test review pages
        const testFilePath = path.join(testsBuildDirectory, directory, test);
        // TODO: useful for determining smart-diffs
        const output = spawnSync('git', ['log', '-1', '--format="%ad"', testFilePath]);
        const lastEdited = output.stdout.toString().replace(/"/gi, '').replace('\n', '');

        tests.push({
          testNumber: tests.length + 1,
          title: title.value,
          name: testFullName,
          location: `/${directory}/${test}`,
          reference: `/${directory}/${path.posix.join(
            path.dirname(reference.value),
            path.basename(reference.value, '.html')
          )}${testData.setupTestPage ? `.${testData.setupTestPage}` : ''}.html`,
          allRelevantATsFormatted: testData.applies_to.join(', '),
          allRelevantATsSpaceSeparated: testData.applies_to.join(' '),
          allRelevantATs: testData.applies_to,
          setupScriptName: testData.setupTestPage,
          task,
          mode,
          ATTests,
          helpLinks,
          lastEdited,
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

if (TARGET_TEST_PLAN) {
  if (allTestsForPattern[TARGET_TEST_PLAN]) {
    let rendered = mustache.render(template, {
      pattern: TARGET_TEST_PLAN,
      totalTests: allTestsForPattern[TARGET_TEST_PLAN].length,
      tests: allTestsForPattern[TARGET_TEST_PLAN],
      AToptions: support.ats,
      setupScripts: scripts,
    });

    let summaryBuildFile = path.resolve(reviewBuildDirectory, `${TARGET_TEST_PLAN}.html`);
    fse.writeFileSync(summaryBuildFile, rendered);

    console.log(`Summarized ${TARGET_TEST_PLAN} tests: ${summaryBuildFile}`);
  } else {
    // most likely to happen if incorrect directory specified
    console.error('ERROR: Unable to find valid test plan(s).');
    process.exit();
  }
} else {
  for (let pattern in allTestsForPattern) {
    let rendered = mustache.render(template, {
      pattern: pattern,
      totalTests: allTestsForPattern[pattern].length,
      tests: allTestsForPattern[pattern],
      AToptions: support.ats,
      setupScripts: scripts,
    });

    let summaryBuildFile = path.resolve(reviewBuildDirectory, `${pattern}.html`);
    fse.writeFileSync(summaryBuildFile, rendered);

    console.log(`Summarized ${pattern} tests: ${summaryBuildFile}`);
  }
}

const renderedIndex = mustache.render(indexTemplate, {
  patterns: Object.keys(allTestsForPattern).map(pattern => {
    // TODO: useful for determining smart-diffs; this has to continue generating for all patterns until smart-diffs come into play
    const lastCommit = spawnSync('git', [
      'log',
      '-n1',
      '--oneline',
      path.join('.', 'tests', pattern),
    ]).stdout.toString();
    return {
      name: pattern,
      title: allTestsForPattern[pattern][0].title,
      numberOfTests: allTestsForPattern[pattern].length,
      commit: lastCommit.split(' ')[0],
      commitDescription: lastCommit,
    };
  }),
});

fse.writeFileSync(indexFileBuildOutputPath, renderedIndex);

console.log(`\nGenerated index.html: ${indexFileBuildOutputPath}`);
console.log('\nDone.');
