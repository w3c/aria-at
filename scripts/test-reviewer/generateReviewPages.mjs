import path from 'path';
import fse from 'fs-extra';
import mustache from 'mustache';
import getRenderValues from './getRenderValues.mjs';
import { spawnSync } from 'child_process';

const generatePatternPages = ({
  template,
  patterns,
  atOptions,
  setupScripts,
  allTestsForPattern,
  referencesForPattern,
  reviewBuildDirectory,
}) => {
  patterns.forEach(pattern => {
    const references = referencesForPattern[pattern];
    const renderValues = getRenderValues({
      pattern,
      references,
      atOptions,
      tests: allTestsForPattern[pattern],
      setupScripts,
    });
    const rendered = mustache.render(template, renderValues);
    const summaryBuildFile = path.resolve(reviewBuildDirectory, `${pattern}.html`);

    fse.writeFileSync(summaryBuildFile, rendered);
    console.log(`Summarized ${pattern} tests: ${summaryBuildFile}`);
  });
};

const generateIndexPage = ({ indexTemplate, allTestsForPattern, indexFileBuildOutputPath }) => {
  const renderedIndex = mustache.render(indexTemplate, {
    patterns: Object.keys(allTestsForPattern)
      .map(pattern => {
        // TODO: useful for determining smart-diffs; this has to continue generating for all patterns until smart-diffs come into play
        const lastCommit = spawnSync('git', [
          'log',
          '-n1',
          '--oneline',
          path.join('.', 'tests', pattern),
        ]).stdout.toString();
        return {
          patternName: pattern,
          title: allTestsForPattern[pattern][0].title,
          numberOfTests: allTestsForPattern[pattern].length,
          commit: lastCommit.split(' ')[0],
          commitDescription: lastCommit,
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
  console.log(`\nSuccessfully generated index.html: ${indexFileBuildOutputPath}`);
};

export { generatePatternPages, generateIndexPage };
