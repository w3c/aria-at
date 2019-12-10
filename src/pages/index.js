import React from 'react'
import { Link } from 'components/Router'

export default () => (
  <div style={{ textAlign: 'center' }}>
    <h2>ARIA-AT Test Runner Prototype</h2>
    <h3>
    <Link to="/aria-at/runner">Run tests with the test runner</Link>
    </h3>
    <h3>
    <Link to="/aria-at/results">See results for previous test runs</Link>
    </h3>
  </div>
)
