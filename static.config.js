import fse from 'fs-extra';
import path from 'path';
import { parse } from 'node-html-parser';
import { spawnSync } from 'child_process';

const resultsDir = path.resolve('.', 'results');
const testDir = path.resolve('.', 'tests');
const publicTestDir = path.resolve('.', 'public', 'tests');
const support = require(path.resolve('.', 'tests', 'support.json'));

export default {
  getRoutes: async () => {

    // Create the test review pages
    const cmd = 'npm';
    const cmdargs = ['run', 'review-tests'];
    const output = spawnSync(cmd, cmdargs);

    // Move all the test files
    await fse.copy(testDir, publicTestDir);
    const allTests = {};

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
	    const root = parse(fse.readFileSync(testFile, 'utf8'));
	    const testFullName = root.querySelector('title').innerHTML;

	    tests.push({
	      designPattern: subDir,
	      name: test.slice(0, -5),
	      fullName: testFullName,
	      location: `/${subDir}/${test}`
	    });
	  }
	});

	if (tests.length) {
          allTests[subDir] = tests;
	}
      }
    });

    // Get all the result jsons
    const allResults = [];

    let i = 0;
    fse.readdirSync(resultsDir).forEach(function (file) {
      i++;
      const fullPath = path.join(resultsDir, file);
      const stat = fse.statSync(fullPath);
      if (stat.isFile() && path.extname(file) === '.json') {
	const result = JSON.parse(fse.readFileSync(fullPath, 'utf8'));
	result.fileName = path.basename(file, '.json');
	result.id = i.toString();
	allResults.push(result);
      }
    });

    return [
      {
        path: '/runner',
        getData: () => ({
          allTests: allTests,
          ats: support.ats
        }),
        children: Object.keys(allTests).map(designPattern => ({
          path: `/design-pattern/${designPattern}`,
          template: 'src/containers/designPattern',
          getData: () => ({
            tests: allTests[designPattern]
          }),
        }))
      },
      {
        path: '/results',
        getData: () => ({
          allResults: allResults
        }),
        children: allResults.map(result => ({
          path: `/test-run/${result.id}`,
          template: 'src/containers/resultPage',
          getData: () => ({
            result,
          }),
        }))
      },
      {
        path: '/review-test-plans',
        getData: () => ({
          allTests: allTests
        })
      }
    ]
  },
  plugins: [
    [
      require.resolve('react-static-plugin-source-filesystem'),
      {
        location: path.resolve('./src/pages'),
      },
    ],
    require.resolve('react-static-plugin-reach-router'),
    require.resolve('react-static-plugin-sitemap'),
  ],
  siteRoot: "https://w3c.github.io",
  basePath: "aria-at",
  devBasePath: "aria-at",
}
