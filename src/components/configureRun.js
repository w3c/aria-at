import React, { Component, Fragment } from 'react';

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
    };

    this.selectTestEl = React.createRef();

    this.runTests = this.runTests.bind(this);
    this.selectTest = this.selectTest.bind(this);
    this.selectAT = this.selectAT.bind(this);
  }

  selectAT(event) {
    this.setState({
      at: event.target.value
    });
  }

  selectTest(event) {
    let newSelectedTests = Object.assign({}, this.state.selectedTests);

    let checkbox = event.target.name;
    if (checkbox.indexOf('all-') === 0) {
      let designPattern = checkbox.slice(4);
      let checked = event.target.checked;
      for (let test in newSelectedTests[designPattern]) {
        newSelectedTests[designPattern][test] = checked;
      }
    }
    else {
      let designPattern = checkbox.split('_')[0];
      let test = checkbox.split('_')[1];
      let checked = event.target.checked;
      newSelectedTests[designPattern][test] = checked;
    }

    this.setState({
      selectedTests: newSelectedTests
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
      this.props.startRun({tests: tests, at: this.state.at});
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
      <details className="design-pattern-options" key={designPattern}>
	<summary className="configuration-item">
          <input type="checkbox" id={id} name={id} checked={isChecked}
            onChange={this.selectTest}
          />
          <label
            htmlFor={id}
          >
            Run all tests for desing pattern: {designPattern}
          </label>
  	</summary>
	<ul className="select-test-list">
	  {testList.map((test) => this.renderTestSelectable(designPattern, test))}
	</ul>
      </details>
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
    const { allTests, ats, browser } = this.props;

    return (
      <section>
        <h1>It's test time!</h1>
        <div ref={this.selectTestEl} tabIndex="0">Select at least one test to run:</div>
        {Object.keys(allTests).map((designPattern) => this.renderDesignPatternSelectable(designPattern, allTests[designPattern]))}
        <div className="configuration-item">
          <label htmlFor="select-at">Select which assistive technology you are testing:</label>
          <select name="at" id="select-at" value={this.state.value} onChange={this.selectAT}>
	    {ats.map((at) => ( <option value={at} key={at}>{at}</option> )) }
          </select>
        </div>
        <div className="configuration-item">
          Saving results for UserAgent: <span className="us">{browser}</span>
        </div>
        <button onClick={this.runTests}>
          Run Selected Tests
        </button>
      </section>
    );
  }
}
