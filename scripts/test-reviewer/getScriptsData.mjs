import path from 'path';
import fse from 'fs-extra';

/**
 * @param {string} testPlanDirectory
 * @returns {string[]}
 */
const getScriptsData = testPlanDirectory => {
  const scriptsPath = path.join(testPlanDirectory, 'data', 'js');
  const scripts = [];

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

  return scripts;
};

export default getScriptsData;
