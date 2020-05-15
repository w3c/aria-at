import React, { Component, Fragment } from 'react';
import { Head } from 'react-static';

export default class RunResults extends Component {

  constructor(props) {
    super(props);
  }

  renderResultRow(result, i) {

    const details = result.details;
    return (
      <tr key={details.name}>
        <td><a href={`#test-${i.toString()}`}>{details.name}</a></td>
        <td>{details.summary[1].pass} / {details.summary[1].fail}</td>
        <td>{details.summary[2].pass} / {details.summary[2].fail}</td>
        <td>{details.unexpectedCount}</td>
      </tr>
    );
  }

  renderResultDetails(result, i) {

    const details = result.details;
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
          <p>Output: "{command.output}"</p>
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

    let loadedFromFile = resultsData.fileName ? true : false;
    let fileName = resultsData.fileName
	? `${resultsData.fileName}.json`
	: `results_${assistiveTechnology.name}-${assistiveTechnology.version}_${browser.name}-${browser.version}_${new Date().toISOString()}.json`;
    let dateOfRun = resultsData.dateOfRun ? new Date(resultsData.dateOfRun).toLocaleString() : undefined;
    let testCase = resultsData.designPattern;
    let testCaseTestPageMap = {
      "checkbox": "../../tests/checkbox/reference/two-state-checkbox.html",
      "menubar-edit": "../../tests/menubar-edit/reference/menubar-editor.html",
      "combobox-autocomplete-both": "../../tests/combobox-autocomplete-both/reference/combobox-autocomplete-both.html"
    };
    let testCaseLink = testCaseTestPageMap[testCase];

    // This array is for caculating percentage support
    // Accross all tests for priorities 1-2
    let support = {
      1: [0, 0],
      2: [0, 0]
    };
    let totalUnexpecteds = 0;

    for (let result of results) {
      let details = result.details;
      totalUnexpecteds += parseInt(details.unexpectedCount);
      for (let i = 1; i <= 2; i++) {
        support[i][0] += details.summary[i].pass;
        support[i][1] += details.summary[i].pass + details.summary[i].fail;
      }
    }

    let atVersion = assistiveTechnology.version ? ` (${assistiveTechnology.version})` : '';
    let browserVersion = browser.version ? ` (${browser.version})` : '';

    return (
      <Fragment>
        <Head>
          <title>ARIA-AT: Test Run Results</title>
        </Head>
        <nav aria-label="Breadcrumb">
          <a href="/aria-at/">ARIA-AT Home</a> &gt; <a href="/aria-at/results/">Test Results</a>
        </nav>
        <section>
          <h1>{`Results for test run of pattern "${designPattern}" (${countTests} test${countTests === 1 ? '' : 's'})`}</h1>
          <p>CAUTION: The information on this page is preliminary and not for use outside the ARIA-AT project.</p>
          <p>
            {`Results for ${assistiveTechnology.name}${atVersion} in ${browser.name}${browserVersion}`}
          </p>
            <ul>
              <li><a href={testCaseLink}>Test Case: {testCase}</a></li>
              {dateOfRun && <li>Updated: {dateOfRun}</li>}
              {loadedFromFile && <li>Loaded from result file: {fileName}</li>}
              <li>
                <a download={fileName} href={`data:application/json;charset=utf-8;,${encodeURIComponent(JSON.stringify(resultsData))}`}>
                  Download Results JSON
                </a>
              </li>
            </ul>
          <h2>Summary of tests</h2>
          <table className="results-table">
            <thead>
              <tr>
                <th>Test</th>
                <th><div>Required</div><div>(pass/fail)</div></th>
                <th><div>Optional</div><div>(pass/fail)</div></th>
                <th><div>Unexpected Behaviors</div><div>(total count)</div></th>
              </tr>
            </thead>
            <tbody>
              {results.map((result, i) => this.renderResultRow(result, i))}
              <tr>
                <td>Support</td>
                <td>{support[1][1] ? `${Math.round((support[1][0]/support[1][1])*100)}%` : '-'}</td>
                <td>{support[2][1] ? `${Math.round((support[2][0]/support[2][1])*100)}%` : '-'}</td>
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
