import React, { Fragment } from 'react';
import { useRouteData, Head } from 'react-static';

const resultsByPattern = {};

export default function ResultsPage() {
  const { allTests } = useRouteData();

  let patterns = Object.keys(allTests);

  return (
    <Fragment>
      <Head>
        <title>ARIA-AT: Review Test Plans</title>
      </Head>
      <h1>Test plans for design patterns:</h1>
      <ul>
        {Object.keys(allTests).map((p) => <li><a href={`/aria-at/review/${p}.html`}>{`Review tests for pattern: ${p}`}</a></li>)}
      </ul>
    </Fragment>
  );
}
