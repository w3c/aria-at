import React, { Component, Fragment } from 'react';
import { Head } from 'react-static';

export default class RunResults extends Component {

  constructor(props) {
    super(props);
  }

  renderResultRow(result, i) {

    // Details is an array of one because the tests originally were designed to have multiple "behavior" tests,
    // but for now all tests only test one "behavior" and this functionality might be removed.
    const details = result.details[0];

    return (
      <tr key={details.name}>
        <td><a href={`#test-${i.toString()}`}>{details.name}</a></td>
        <td>{details.summary[1].pass} / {details.summary[1].fail}</td>
        <td>{details.summary[2].pass} / {details.summary[2].fail}</td>
        <td>{details.summary[3].pass} / {details.summary[3].fail}</td>
        <td>{details.summary.unexpectedCount}</td>
      </tr>
    );
  }

  renderResultDetails(result, i) {

    // Details is an array of one because the tests originally were designed to have multiple "behavior" tests,
    // but for now all tests only test one "behavior" and this functionality might be removed.
    const details = result.details[0];

    return (
      <section>
        <h2 id={`test-${i.toString()}`}>Details for test "{details.name}"</h2>
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
    let { resultsData } = this.props;
    let { assistiveTechnology, browser, designPattern, results } = resultsData;
    let countTests = results.length;

    let fileName = resultsData.fileName
	? `${resultsData.fileName}.json`
	: `results_${assistiveTechnology.name}-${assistiveTechnology.version}_${browser.name}-${browser.version}_${new Date().toISOString()}.json`;


    // This array is for caculating percentage support
    // Accross all tests for priorities 1-3
    let support = {
      1: [0, 0],
      2: [0, 0],
      3: [0, 0]
    };
    let totalUnexpecteds = 0;

    for (let result of results) {
      let details = result.details[0];
      totalUnexpecteds += details.summary.unexpectedCount;
      for (let i = 1; i <= 3; i++) {
        support[i][0] += details.summary[i].pass;
        support[i][1] += details.summary[i].pass + details.summary[i].fail;
      }
    }


    return (
      <Fragment>
        <Head>
          <title>ARIA-AT: Test Run Results</title>
        </Head>
        <section>
          <h1>{`Results for test run of pattern "${designPattern}" (${countTests} test${countTests === 1 ? '' : 's'})`}</h1>
          <p>
            {`${assistiveTechnology.name} (${assistiveTechnology.version}) on ${browser.name} (${browser.version})`}
          </p>
          { fileName &&
            <p>
              Loaded from result file: {fileName}
            </p>
          }
	  <p>
            <a
              download={fileName}
              href={`data:application/json;charset=utf-8;,${encodeURIComponent(JSON.stringify(resultsData))}`}>Download Results JSON
            </a>
	  </p>
          <h2>Summary of tests</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Test</th>
                <th><div>Must Have</div><div>(pass/fail)</div></th>
                <th><div>Should Have</div><div>(pass/fail)</div></th>
                <th><div>Nice to Have</div><div>(pass/fail)</div></th>
                <th><div>Unexpected Behaviors</div><div>(total count)</div></th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, i) => this.renderResultRow(result, i))}
              <tr>
                <td>Support</td>
                <td>{support[1][1] ? `${Math.round((support[1][0]/support[1][1])*100)}%` : '-'}</td>
                <td>{support[2][1] ? `${Math.round((support[2][0]/support[2][1])*100)}%` : '-'}</td>
                <td>{support[3][1] ? `${Math.round((support[3][0]/support[3][1])*100)}%` : '-'}</td>
                <td>{totalUnexpecteds ? `${totalUnexpecteds} command(s) produced unexpected behaviors` : "No unexpected behaviors" }</td>
              </tr>
            </tbody>
          </table>
        </section>
        {results.map((result, i) => this.renderResultDetails(result, i))}
      </Fragment>
    );
  }
}
