import React, { Component, Fragment } from 'react';

export default class testResults extends Component {

  constructor(props) {
    super(props);
  }

  renderResultRow(result) {

    // Details is an array of one because the tests originally were designed to have multiple "behavior" tests,
    // but for now all tests only test one "behavior" and this functionality might be removed.
    const details = result.details[0];

    return (
      <tr>
        <td>{details.name}</td>
        <td>{result.status}</td>
        <td>{details.summary[1].pass} / {details.summary[1].fail}</td>
        <td>{details.summary[2].pass} / {details.summary[2].fail}</td>
        <td>{details.summary[3].pass} / {details.summary[3].fail}</td>
        <td>{details.summary.unexpectedCount}</td>
      </tr>
    );
  }

  renderResultDetails(result) {

    // Details is an array of one because the tests originally were designed to have multiple "behavior" tests,
    // but for now all tests only test one "behavior" and this functionality might be removed.
    const details = result.details[0];

    return (
      <section>
        <h2>Results for: "{details.name}"</h2>
        <table className="results-table">
          <thead>
            <tr>
              <th>Command</th>
              <th>Support</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {details.commands.map((command) => this.renderCommandResults(command))}
          </tbody>
        </table>
      </section>
    );
  }

  renderCommandResults(command) {
    return (
      <tr>
        <td>{command.command}</td>
        <td>{command.support}</td>
        <td>
          <p>JAWS output: "{command.output}"</p>
          <div>Passing Assertions:
            <ul>
              {command.assertions.map((assertion) => this.renderAssertion(assertion, 'passing'))}
            </ul>
          </div>
          <div>Failing Assertions:
            <ul>
              {command.assertions.map((assertion) => this.renderAssertion(assertion, 'failing'))}
            </ul>
          </div>
          <div>Unexpected Behavior:
            <ul>
              {command.unexpected_behaviors.map((behavior) => (<li>behavior</li>))}
            </ul>
          </div>
        </td>
      </tr>
    );
  }

  renderAssertion(assertion, status) {
    if (assertion.fail && status === 'failing') {
      return (
        <li>
          {assertion.assertion}
        </li>
      );
    }
    else if (assertion.pass && status === 'passing') {
      return (
        <li>
          {assertion.assertion}
        </li>
      );
    }
  }

  render() {
    let { results, at, browser } = this.props;

    debugger;
    console.log(results);

    return (
      <Fragment>
        <section>
        <h1>Summary of results</h1>
          <table className="results-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Status</th>
                <th><div>Must Have</div><div>(pass/fail)</div></th>
                <th><div>Must Have</div><div>(pass/fail)</div></th>
                <th><div>Must Have</div><div>(pass/fail)</div></th>
                <th><div>Unexpected Behaviors</div><div>(total count)</div></th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => this.renderResultRow(result))}
            </tbody>
          </table>
        </section>
        {results.map((result) => this.renderResultDetails(result))}
      </Fragment>
    );
  }
}
