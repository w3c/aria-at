import path from 'path';
import fse from 'fs-extra';

/**
 * @param {string} testPlanDirectory
 * @returns {{linkText: *, refId: *, type: *, value: *}[]}
 */
const getReferencesData = testPlanDirectory => {
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

  return referencesData.map(referenceData => {
    let refId = referenceData.refId?.trim();
    let type = referenceData.type?.trim();
    let value = referenceData.value?.trim();
    let linkText = referenceData.linkText?.trim();

    return { refId, type, value, linkText };
  });
};

export default getReferencesData;
