import path from 'path';
import fse from 'fs-extra';

/**
 * @param {string} testPlanDirectory
 * @param aria
 * @param htmlAam
 * @returns {{linkText: *, refId: *, type: *, value: *}[]}
 */
const getReferencesData = (testPlanDirectory, aria, htmlAam) => {
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

  return referencesData.map(
    ({ refId: _refId, type: _type, value: _value, linkText: _linkText }) => {
      let refId = _refId?.trim();
      let type = _type?.trim();
      let value = _value?.trim();
      let linkText = _linkText?.trim();

      if (type === 'aria') {
        value = `${aria.baseUrl}${aria.fragmentIds[value]}`;
        linkText = `${linkText} ${aria.linkText}`;
      }

      if (type === 'htmlAam') {
        value = `${htmlAam.baseUrl}${htmlAam.fragmentIds[value]}`;
        linkText = `${linkText} ${htmlAam.linkText}`;
      }

      return { refId, type, value, linkText };
    }
  );
};

export default getReferencesData;
