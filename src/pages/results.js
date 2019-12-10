import React, { Fragment } from 'react';
import { useRouteData } from 'react-static';
import { Link } from 'components/Router';

export default function ResultsPage() {
  const { allResults } = useRouteData();

  return (
    <Fragment>
      <h1>Test Run Results</h1>
      <ul>
        {allResults.map((r) => <li>{renderResultLink(r)}</li>)}
      </ul>
    </Fragment>
  );
}

function renderResultLink(r) {
  let numberTests = r.results.length;
  let at = r.assistiveTechnology.name;
  let atVersion = r.assistiveTechnology.version;
  let browser = r.browser.name;
  let browserVersion = r.browser.version;

  return (
    <Fragment>
      <Link to={`/results/test-run/${r.id}`}>{`Results for ${numberTests} tests of ${at} (${atVersion}) run on ${browser} (${browserVersion})`}</Link>
      <div className="results-details">{r.fileName}</div>
    </Fragment>
  );
}
