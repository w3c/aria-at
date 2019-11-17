import fse from 'fs-extra';
import path from 'path';
import { parse } from 'node-html-parser';

const testDir = path.resolve('.', 'tests');
const publicTestDir = path.resolve('.', 'public', 'tests');

export default {
  getRoutes: async () => {
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
	    })
	  }
	});

	if (tests.length) {
          allTests[subDir] = tests;
	}
      }
    });

    return [
      {
        path: '/runner',
        getData: () => ({
          allTests: allTests,
	  ats: ['JAWS','NVDA','VoiceOver']
        }),
        children: Object.keys(allTests).map(designPattern => ({
          path: `/design-pattern/${designPattern}`,
          template: 'src/containers/designPattern',
          getData: () => ({
            tests: allTests[designPattern]
          }),
        })),
      },
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
}
