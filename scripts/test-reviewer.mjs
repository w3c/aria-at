import path from 'path';
import fs from 'fs';
import fse from 'fs-extra';
import { spawn, spawnSync } from 'child_process';
import np from 'node-html-parser';
import mustache from 'mustache';
import minimist from 'minimist';
import { commandsAPI as CommandsAPI } from '../tests/resources/at-commands.mjs';
import { Resolver } from 'dns';

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

main();

async function main() {
  let parseTime = 0;

  // on some OSes, it seems the the `npm_config_testplan` environment variable will come back as the actual variable name rather than empty if it does not exist
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
  fs.existsSync(reviewBuildDirectory) || fs.mkdirSync(reviewBuildDirectory);

  const allTestsForPattern = {};
  const support = JSON.parse(fse.readFileSync(supportFilePath));

  let allATKeys = [];
  support.ats.forEach((at) => {
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
  };

  await Promise.all(
    fse.readdirSync(testsDirectory).map(async function (directory) {
      const testPlanDirectory = path.join(testsDirectory, directory);
      const testPlanBuildDirectory = path.join(testsBuildDirectory, directory);
      const stat = fse.statSync(testPlanDirectory);

      if (stat.isDirectory() && directory !== 'resources') {
        // Initialize the commands API
        const commandsJSONFile = path.join(testPlanBuildDirectory, 'commands.json');
        const commands = JSON.parse(fse.readFileSync(commandsJSONFile));
        const commandsAPI = new CommandsAPI(commands, support);

        const tests = [];

        const referencesCsv = fs.readFileSync(
          path.join(testPlanDirectory, 'data', 'references.csv'),
          'UTF-8'
        );
        const reference = referencesCsv
          .split(/\r?\n/)
          .find((s) => s.startsWith('reference,'))
          .split(',')[1];

        const scriptsPath = path.join(testPlanDirectory, 'data', 'js');
        fse.readdirSync(scriptsPath).forEach(function (scriptFile) {
          let script = '';
          try {
            const data = fs.readFileSync(path.join(scriptsPath, scriptFile), 'UTF-8');
            const lines = data.split(/\r?\n/);
            lines.forEach((line) => {
              if (line.trim().length) script += '\t' + line.trim() + '\n';
            });
          } catch (err) {
            console.error(err);
          }
          scripts.push(`\t${scriptFile.split('.js')[0]}: function(testPageDocument){\n${script}}`);
        });

        await Promise.all(
          fse.readdirSync(testPlanBuildDirectory).map(async function (test) {
            if (
              path.extname(test) === '.html' &&
              !/\.collected\.html$/.test(test) &&
              path.basename(test) !== 'index.html'
            ) {
              const testFile = path.join(testsBuildDirectory, directory, test);
              const parseStart =
                typeof performance === 'undefined' ? Date.now() : performance.now();
              const root = np.parse(fse.readFileSync(testFile, 'utf8'), { script: true });
              parseTime +=
                typeof performance === 'undefined' ? Date.now() - parseStart : performance.now();

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

              for (const atKey of allRelevantATs.map((a) => a.toLowerCase())) {
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
                      ? assertions.map((a) => ({
                          priority: getPriorityString(a[0]),
                          description: a[1],
                        }))
                      : undefined,
                  userInstruction,
                  modeInstruction: commandsAPI.getModeInstructions(mode, at),
                  setupScriptDescription: testData.setup_script_description,
                });
              }

              // Create the test review pages
              const testFilePath = path.join(testsBuildDirectory, directory, test);
              // TODO: useful for determining smart-diffs
              const output = await spawnAsync('git', ['log', '-1', '--format="%ad"', testFilePath]);
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
                lastEdited,
              });
            }
          })
        );

        if (tests.length) {
          allTestsForPattern[directory] = tests;
        }
      }
    })
  );

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
    patterns: await Promise.all(
      Object.keys(allTestsForPattern).map(async (pattern) => {
        // TODO: useful for determining smart-diffs; this has to continue generating for all patterns until smart-diffs come into play
        const lastCommit = (
          await spawnAsync('git', ['log', '-n1', '--oneline', path.join('.', 'tests', pattern)])
        ).stdout.toString();
        return {
          name: pattern,
          numberOfTests: allTestsForPattern[pattern].length,
          commit: lastCommit.split(' ')[0],
          commitDescription: lastCommit,
        };
      })
    ),
  });

  fse.writeFileSync(indexFileBuildOutputPath, renderedIndex);

  console.log(`\nGenerated index.html: ${indexFileBuildOutputPath}`);
  console.log('\nDone.');

  console.log(parseTime, typeof performance);
}

async function spawnAsync(...args) {
  const proc = spawn(...args);

  try {
    const [stdout, stderr, { status, signal }] = await Promise.all([
      concatStreamAsync(proc.stdout),
      concatStreamAsync(proc.stderr),
      waitForEventAsync(proc, 'exit'),
    ]);

    return {
      pid: proc.pid,
      output: [null, stdout, stderr],
      stdout,
      stderr,
      status,
      signal,
      error: null,
    };
  } catch (error) {
    return {
      pid: proc.pid,
      output: [null, null, null],
      stdout: null,
      stderr: null,
      status: null,
      signal: null,
      error,
    };
  }

  /**
   * @param {Stream} stream
   * @returns {Promise<Buffer>}
   */
  function concatStreamAsync(stream) {
    return new Promise((resolve, reject) => {
      /** @type {Buffer[]} */
      const chunks = [];
      stream.on('data', (buffer) => {
        chunks.push(buffer);
      });
      stream.on('error', (error) => {
        reject(error);
      });
      stream.on('end', () => {
        const data = Buffer.alloc(chunks.reduce((length, chunk) => length + chunk.byteLength, 0));
        let index = 0;
        for (const chunk of chunks) {
          chunk.copy(data, index);
          index += chunk.byteLength;
        }
        resolve(data);
      });
    });
  }

  /**
   * @param {EventEmitter<T>} emitter
   * @param {string} event
   * @returns {Promise<T>}
   * @template T
   */
  function waitForEventAsync(emitter, event) {
    return new Promise((resolve) => emitter.once(event, resolve));
  }
}
