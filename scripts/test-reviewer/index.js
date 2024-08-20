const minimist = require('minimist');
// const createReviewPages = require('./createReviewPages.mjs').createReviewPages;

const cliArgs = minimist(process.argv.slice(2), {
  alias: {
    h: 'help',
    t: 'testplan',
  },
});

if (cliArgs.help) {
  console.log(`Default use:
  No arguments:
    Generate review pages.
  Arguments:
    -h, --help
       Show this message.
    -t, --testplan
       Generate review page for an individual test plan directory. eg. --testplan=checkbox
`);
  process.exit();
}

const config = { args: cliArgs };

async function loadCreateReviewPages(config) {
  const _module = await import('./createReviewPages.mjs');
  _module.createReviewPages(config);
}

loadCreateReviewPages(config)
  .then(() => {
    // Do nothing, successfully ran
  })
  .catch(error => {
    console.error(`createReviewPages failed to successfully run: ${error.stack}`);
  });
