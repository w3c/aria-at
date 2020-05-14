import React, { Component, Fragment } from 'react';
import { Head } from 'react-static';

export default class ConfigureRun extends Component {

  constructor(props) {
    super(props);

    let selectedTests = {};
    for (let designPattern in props.allTests) {
      selectedTests[designPattern] = {};
      for (let test of props.allTests[designPattern]) {
        selectedTests[designPattern][test.name] = false;
      }
    }

    this.state = {
      selectedTests,
      at: this.props.ats[0],
      atVersion: '',
      selectedDesignPattern: undefined
    };

    this.selectTestEl = React.createRef();

    this.runTests = this.runTests.bind(this);
    this.selectTest = this.selectTest.bind(this);
    this.selectAT = this.selectAT.bind(this);
    this.selectATVersion = this.selectATVersion.bind(this);
  }

  selectAT(event) {
    // find the AT based on key
    let picked = this.props.ats.find(o => o.key === event.target.value);
    this.setState({
      at: picked
    });
  }

  selectATVersion(event) {
    this.setState({
      atVersion: event.target.value
    });
  }

  selectTest(event) {
    let newSelectedTests = Object.assign({}, this.state.selectedTests);
    let newDesignPattern = this.state.selectedDesignPattern;

    let checkbox = event.target.name;
    if (checkbox.indexOf('all-') === 0) {
      let designPattern = checkbox.slice(4);
      let checked = event.target.checked;

      // Select all tests for newly selected design pattern, and unselect all other tests
      if (checked) {
        newDesignPattern = designPattern;

        for (let dp in newSelectedTests) {
          for (let test in newSelectedTests[dp]) {
            newSelectedTests[dp][test] = dp === designPattern ? true : false;
          }
        }
      }
      // Unselect all tests for design pattern
      else {
        newDesignPattern = undefined;
        for (let test in newSelectedTests[designPattern]) {
          newSelectedTests[designPattern][test] = false;
        }
      }
    }
    else {
      let designPattern = checkbox.split('_')[0];
      let test = checkbox.split('_')[1];
      let checked = event.target.checked;
      newSelectedTests[designPattern][test] = checked;
      newDesignPattern = designPattern;

      // Unselect tests of all other design patterns
      for (let dp in newSelectedTests) {
        if (dp !== designPattern) {
          for (let test in newSelectedTests[dp]) {
            newSelectedTests[dp][test] = false;
          }
        }
      }
    }

    this.setState({
      selectedTests: newSelectedTests,
      selectedDesignPattern: newDesignPattern,
    });
  }

  runTests(event) {
    const { allTests } = this.props;

    let tests = [];
    for (let designPattern in allTests) {
      for (let test of allTests[designPattern]) {
        if (this.state.selectedTests[designPattern][test.name]) {
          tests.push(test);
        }
      }
    }

    if (tests.length) {
      this.props.startRun({tests: tests, at: this.state.at.key, atVersion: this.state.atVersion, designPattern: this.state.selectedDesignPattern});
    }
    else {
      this.selectTestEl.current.focus();
    }
  }

  isDesignPatternChecked(designPattern) {
    let allChecked = true;
    for (let test in this.state.selectedTests[designPattern]) {
      allChecked = allChecked && this.state.selectedTests[designPattern][test];
    }
    return allChecked;
  }

  renderDesignPatternSelectable(designPattern, testList) {
    let isChecked = this.isDesignPatternChecked(designPattern);
    let id = `all-${designPattern}`;

    return (
      <Fragment>
        <input type="checkbox" id={id} name={id} checked={isChecked}
            onChange={this.selectTest}
        />
        <label htmlFor={id}>Select all tests for {designPattern}</label>
        <details className="design-pattern-options" key={designPattern}>
          <summary className="configuration-item">
              Select individual tests for {designPattern}
          </summary>
          <ul className="select-test-list">
            {testList.map((test) => this.renderTestSelectable(designPattern, test))}
          </ul>
        </details>
      </Fragment>
    );
  }

  renderTestSelectable(designPattern, test) {

    let optionId = `${designPattern}_${test.name}`;
    let isChecked = this.state.selectedTests[designPattern][test.name];

    return (
      <li className="select-test-item" key={test.location}>
        <input type="checkbox" id={optionId} name={optionId} checked={isChecked}
          onChange={this.selectTest}
        />
        <label
          htmlFor={optionId}
          title={test.fullName}
          className="engine-label"
        >
          {test.fullName} <div className="test-details">{test.location.slice(1)}</div>
        </label>
      </li>
    );
  }

  render() {
    const { allTests, ats, browser, browserVersion } = this.props;

    let countTests = 0;
    let selectedPatterns = new Set();
    for (let designPattern in allTests) {
      for (let test of allTests[designPattern]) {
        if (this.state.selectedTests[designPattern][test.name]) {
          countTests++;
          selectedPatterns.add(designPattern);
        }
      }
    }

    return (
      <Fragment>
        <Head>
          <title>ARIA-AT: Configure Test Run</title>
        </Head>
        <section>
          <h1>It's test time!</h1>
          <div ref={this.selectTestEl} tabIndex="0">Select at least one test to run. Only one design pattern can be tested at a time.</div>
          {Object.keys(allTests).map((designPattern) => this.renderDesignPatternSelectable(designPattern, allTests[designPattern]))}
          <div className="configuration-item">
            <label htmlFor="select-at">Select which assistive technology you are testing: </label>
            <select name="at" id="select-at" value={this.state.at.key} onChange={this.selectAT}>
              {ats.map((at) => ( <option value={at.key} key={at.key}>{at.name}</option> )) }
            </select>
          </div>
          <div className="configuration-item">
            <label htmlFor="select-at">Which version of {this.state.at.name}?: </label>
            <input type="text" name="at-version" id="select-at-version" value={this.state.atVersion} onChange={this.selectATVersion} />
          </div>
          <div className="configuration-item">
            Saving results for UserAgent: <span className="us">{browser} ({browserVersion})</span>
          </div>
          <button onClick={this.runTests}>
            {
              countTests
                ? `Run ${countTests} test${countTests === 1 ? '' : 's'} for pattern "${this.state.selectedDesignPattern}"`
                : "Run 0 tests"
            }
          </button>
        </section>
      </Fragment>
    );
  }
}
