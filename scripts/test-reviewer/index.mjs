import minimist from 'minimist';
import { createReviewPages } from './createReviewPages.mjs';

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

const args = cliArgs;

createReviewPages({ args });
