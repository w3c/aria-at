import React, { Component, Fragment } from 'react';
import ConfigureRun from 'components/configureRun';
import TestResults from 'components/testResults';
import TestRun from 'components/testRun';
import Bowser from 'bowser';

export default class Runner extends Component {

  constructor(props) {
    super(props);

    this.state = {
      stage: 'configureRun',
    };

    this.tests = [];
    this.results = [];
    this.browser = '';
    this.browserVersion
    if (typeof window !== "undefined") {
      let b = Bowser.getParser(window.navigator.userAgent);
      this.browser = b.getBrowser().name;
      this.browserVersion = b.getBrowser().version;
    }

    this.finishRun = this.finishRun.bind(this);
    this.startRun = this.startRun.bind(this);
  }

  startRun(configuration) {
    this.tests = configuration.tests;
    this.at = configuration.at;
    this.atVersion = configuration.atVersion;
    this.setState({
      stage: 'runTests'
    });
  }

  finishRun(results) {
    this.results = results;
    this.setState({
      stage: 'displayResults'
    });
  }


  renderTestRun() {
    return (
      <TestRun
        tests={this.tests}
        browser={this.browser}
        browserVersion={this.browserVersion}
        at={this.at}
        atVersion={this.atVersion}
        finishRun={this.finishRun}
      />
    );
  }

  renderConfigureRun() {
    return (
      <ConfigureRun
        ats={this.props.ats}
        allTests={this.props.allTests}
        startRun={this.startRun}
        browser={this.browser}
        browserVersion={this.browserVersion}
      />
    );
  }

  renderResults() {
    return (
      <TestResults
        results={this.results}
        at={this.at}
        atVersion={this.atVersion}
        browser={this.browser}
        browserVersion={this.browserVersion}
      />
    );
  }

  render() {
    return (
      <Fragment>
      { this.state.stage === 'configureRun' && this.renderConfigureRun() }
      { this.state.stage === 'runTests' && this.renderTestRun() }
      { this.state.stage === 'displayResults' && this.renderResults() }
      </Fragment>

    );
  }
}
