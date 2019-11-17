import React from 'react';
import { useRouteData } from 'react-static';
import { Link } from 'components/Router';
import Runner from 'components/runner';

export default function RunnerPage() {
  const { allTests, ats } = useRouteData();

  return (
    <div>
      <Runner
         allTests={allTests}
         ats={ats}
      />
    </div>
  );
}
