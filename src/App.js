import React from 'react';
import { Root, Routes, addPrefetchExcludes } from 'react-static';
//
import { Link, Router } from 'components/Router';

import './app.css'

function App() {
  return (
    <Root>
      <h1 className="header">
        ARIA-AT Project
      </h1>
      <div className="content">
        <React.Suspense fallback={<em>Loading...</em>}>
          <Router>
            <Routes path="*" />
          </Router>
        </React.Suspense>
      </div>
    </Root>
  );
}

export default App;
