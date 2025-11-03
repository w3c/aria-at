import path from 'path';
import fse from 'fs-extra';
import mustache from 'mustache';
import { spawnSync } from 'child_process';
import getRenderValues from './getRenderValues.mjs';
import { consoleColors, consoleText } from '../../lib/util/console.js';

const generatePatternPages = ({
  template,
  patterns,
  atOptions,
  setupScripts,
  allTestsForPattern,
  referencesForPattern,
  reviewBuildDirectory,
  testPlansInfo = {},
  testMode = false,
}) => {
  patterns.forEach(pattern => {
    const info = testPlansInfo[pattern];
    const patternName = info?.name || pattern;
    const references = referencesForPattern[patternName];

    const renderValues = getRenderValues({
      pattern: patternName,
      references,
      atOptions,
      tests: allTestsForPattern[pattern],
      setupScripts,
    });
    const rendered = mustache.render(template, renderValues);

    // Create subfolder structure if needed
    let summaryBuildFile;
    if (info?.subfolder) {
      const subfolderReviewDir = path.resolve(reviewBuildDirectory, info.subfolder);
      fse.existsSync(subfolderReviewDir) || fse.mkdirSync(subfolderReviewDir, { recursive: true });
      summaryBuildFile = path.resolve(subfolderReviewDir, `${patternName}.html`);
    } else {
      summaryBuildFile = path.resolve(reviewBuildDirectory, `${patternName}.html`);
    }

    fse.writeFileSync(summaryBuildFile, rendered);
    consoleText(`Summarized ${pattern} tests: ${summaryBuildFile}`, {
      color: consoleColors.green,
    });
  });
};

const generateIndexPage = ({
  indexTemplate,
  allTestsForPattern,
  indexFileBuildOutputPath,
  testMode = false,
}) => {
  const infoMap = allTestsForPattern.info || {};
  const renderedIndex = mustache.render(indexTemplate, {
    patterns: Object.keys(allTestsForPattern)
      .filter(key => key !== 'info')
      .map(patternKey => {
        const info = infoMap[patternKey];
        const patternName = info?.name || patternKey;
        const testPlanPath = info?.subfolder
          ? path.join('tests', info.subfolder, patternName)
          : path.join('tests', patternName);

        // TODO: useful for determining smart-diffs; this has to continue generating for all patterns until smart-diffs come into play
        const lastCommit = spawnSync('git', [
          'log',
          '-n1',
          '--oneline',
          testPlanPath,
        ]).stdout.toString();

        return {
          patternName: patternKey,
          title: allTestsForPattern[patternKey][0].title,
          numberOfTests: allTestsForPattern[patternKey].length,
          commit: testMode ? null : lastCommit.split(' ')[0],
          commitDescription: testMode ? null : lastCommit,
        };
      })
      .sort((a, b) => {
        const titleA = a.title.toUpperCase();
        const titleB = b.title.toUpperCase();

        if (titleA < titleB) return -1;
        if (titleA > titleB) return 1;
        return 0;
      }),
  });

  fse.writeFileSync(indexFileBuildOutputPath, renderedIndex);
  consoleText(`\nSuccessfully generated index.html: ${indexFileBuildOutputPath}`, {
    color: consoleColors.green,
  });
};

export { generatePatternPages, generateIndexPage };
