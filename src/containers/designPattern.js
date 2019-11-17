import React from 'react';
import { useRouteData } from 'react-static';
import { Link } from 'components/Router';
import TestRun from 'components/testRun';

export default function Post() {
  const { tests } = useRouteData();
  return (
    <div>
      <h1>Running all tests for Design Pattern: {tests[0]['designPattern']}</h1>
      <TestRun
         tests={tests}
      />
    </div>
  );
}
