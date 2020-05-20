import React from 'react'
import { Link } from 'components/Router'

export default () => (
  <div>
    <h2>ARIA-AT Test Runner Prototype</h2>
    <p>
      This site is a prototype for manually running <a href="https://github.com/w3c/aria-at">ARIA-AT</a> tests, reviewing test results, and reviewing test plans.
      This functionality is in the process of being replaced with a new system, <a href="https://github.com/bocoup/aria-at-app">ARIA-AT App</a>.
    </p>
    <ul>
      <li>
        <Link to="/aria-at/runner/">Run tests with the prototype test runner</Link>
      </li>
      <li>
        <Link to="/aria-at/results/">See results for previous test runs (from the prototype test runner)</Link>
      </li>
      <li>
        <Link to="/aria-at/review-test-plans/">Review test plans for design patterns</Link>
      </li>
    </ul>
  </div>
)
