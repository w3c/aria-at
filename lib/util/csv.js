const csv = require('csv-parser');

/**
 * @param {ReadableStream} readable
 * @param {object} options
 * @param {function(...*): void} options.logError
 * @returns {Promise<object[]>}
 */
function read(readable, { logError }) {
  return new Promise((resolve, reject) => {
    const rows = [];
    readable
      .pipe(
        csv({
          mapHeaders: ({ header, index }) => {
            if (header.toLowerCase().includes('\ufeff')) {
              logError(
                `Unwanted U+FEFF found for key ${header} at index ${index} while processing CSV.`
              );
            }
            return header.replace(/^\uFEFF/g, '');
          },
          mapValues: ({ header, value }) => {
            if (value.toLowerCase().includes('\ufeff')) {
              logError(
                `Unwanted U+FEFF found for value in key, value pair (${header}: ${value}) while processing CSV.`
              );
            }
            return value.replace(/^\uFEFF/g, '');
          },
        })
      )
      .on('data', row => {
        rows.push(row);
      })
      .on('end', () => {
        resolve(rows);
      })
      .on('error', reject);
  });
}

exports.read = read;
