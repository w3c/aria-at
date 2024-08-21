/**
 * Get parsed values from tests/<pattern>/data/references.csv
 *
 * @param {AriaATCSV.Reference[]} references
 * @param {string} refId
 * @returns {{linkText: string, type: string, value: string}}
 */
const getReferenceForDirectory = (references, refId) => {
  const { type, value, linkText } = references.find(el => el.refId === refId) || {};
  return { type, value, linkText };
};

export default getReferenceForDirectory;
