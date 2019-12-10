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
      <tr key={details.name}>
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
          {this.renderPassingAssertions(command.assertions)}
          {this.renderFailingAssertions(command.assertions)}
          {this.renderUnexpectedBehavior(command.unexpected_behaviors)}
        </td>
      </tr>
    );
  }

  renderPassingAssertions(assertions) {
    let passing = assertions.filter(a => a.pass);
    if (passing.length) {
      return (
        <div>Passing Assertions:
          <ul>
            {passing.map((a) => <li>{a.assertion}</li>)}
          </ul>
        </div>
      );
    }
  }

  renderFailingAssertions(assertions) {
    let failing = assertions.filter(a => a.fail);
    if (failing.length) {
      return (
        <div>Failing Assertions:
          <ul>
            {failing.map((a) => <li>{a.assertion}</li>)}
          </ul>
        </div>
      );
    }
  }

  renderUnexpectedBehavior(behaviors) {
    if (behaviors.length) {
      return (
        <div>Unexpected Behaviors:
          <ul>
            {behaviors.map((b) => <li>{b}</li>)}
          </ul>
        </div>
      );
    }
  }

  render() {
    let { results, at, browser, atVersion, browserVersion } = this.props;

    let resultsData = {
      results,
      assitiveTechnology: {
        name: at,
        version: atVersion
      },
      browser: {
        name: browser,
        version: browserVersion
      }
    };

    return (
      <Fragment>
        <a
          download={`results_${at}-${atVersion}_${browser}-${browserVersion}_${new Date().toISOString()}.json`}
          href={`data:application/json;charset=utf-8;,${encodeURIComponent(JSON.stringify(resultsData))}`}>Download Results JSON
        </a>
        <section>
        <h1>Summary of results</h1>
          <table className="results-table">
            <thead>
              <tr>
                <th>Test</th>
                <th>Status</th>
                <th><div>Must Have</div><div>(pass/fail)</div></th>
                <th><div>Should Have</div><div>(pass/fail)</div></th>
                <th><div>Nice to Have</div><div>(pass/fail)</div></th>
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
