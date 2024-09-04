const createAllTests = require('./createAllTests');

createAllTests()
  .then(() => {
    // Do nothing, successfully ran
  })
  .catch(error => {
    console.error(`createAllTests failed to successfully run: ${error.message}`);
  });
