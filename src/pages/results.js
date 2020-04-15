import React, { Fragment } from 'react';
import { useRouteData, Head } from 'react-static';
import { Link } from 'components/Router';

const resultsByPattern = {};

export default function ResultsPage() {
  const { allResults } = useRouteData();

  for (let result of allResults) {
    if (resultsByPattern[result.designPattern]) {
      resultsByPattern[result.designPattern].push(result);
    }
    else {
      resultsByPattern[result.designPattern] = [result];
    }
  }

  return (
    <Fragment>
      <Head>
        <title>ARIA-AT: All Test Results</title>
      </Head>
      <nav aria-label="Breadcrumb">
        <a href="/aria-at/">ARIA-AT Home</a>
      </nav>
      <h1>Test Run Results</h1>
      <ul>
        {Object.keys(resultsByPattern).map((p) => <li>{renderPatternList(p)}</li>)}
      </ul>
    </Fragment>
  );
}

function renderPatternList(p) {

  return (
    <li>
      Test results for design pattern: {p}
      <ul>
        {resultsByPattern[p].map((r) => <li>{renderResultLink(r)}</li>)}
      </ul>
    </li>
  )
}

function renderResultLink(r) {
  let numberTests = r.results.length;
  let at = r.assistiveTechnology.name;
  let atVersion = r.assistiveTechnology.version ? ` (${r.assistiveTechnology.version})` : '';
  let browser = r.browser.name;
  let browserVersion = r.browser.version ? ` (${r.browser.version})` : '';

  return (
    <Fragment>
      <Link to={`/aria-at/results/test-run/${r.id}`}>{`${numberTests} tests of ${at}${atVersion} run on ${browser}${browserVersion}`}</Link>
      <div className="results-details">file: {r.fileName}.json</div>
    </Fragment>
  );
}
