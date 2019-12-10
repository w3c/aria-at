import React from 'react';
import { useRouteData } from 'react-static';
import { Link } from 'components/Router';
import RunResults from 'components/runResults';

export default function ResultPage() {
  const { result } = useRouteData();
  let numberTests = result.results.length;
  let at = result.assistiveTechnology.name;
  let atVersion = result.assistiveTechnology.version;
  let browser = result.browser.name;
  let browserVersion = result.browser.version;

  return (
    <div>
      <h1>{`Results for ${numberTests} tests of ${at} (${atVersion}) run on ${browser} (${browserVersion})`}</h1>
      <p>{`Displaying result file: ${result.fileName}.json`}</p>
      <RunResults
        resultsData={result}
      />
    </div>
  );
}
