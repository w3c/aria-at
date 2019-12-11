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
      <RunResults
        resultsData={result}
      />
    </div>
  );
}
