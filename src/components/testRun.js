import React, { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { Head } from 'react-static';

export default class testRun extends Component {

  constructor(props) {
    super(props);

    this.state = {
      currentTest: 0,
      remindFinishTest: false,
    };

    this.results = [];

    this.handleSubmit = this.handleSubmit.bind(this);
    this.handleSkip = this.handleSkip.bind(this);
    this.handleRedo = this.handleRedo.bind(this);

    this.testIframe = React.createRef();
  }

  handleSkip() {
    if ( this.state.currentTest === this.props.tests.length - 1) {
      this.props.finishRun(this.results);
    }
    else {
      this.setState({
	currentTest: this.state.currentTest + 1
      });
    }
  }

  handleSubmit() {
    let resultsEl = this.testIframe.current.contentDocument.querySelector('#__ariaatharness__results__');

    if (!resultsEl) {
      this.setState({
        remindFinishTest: true
      });
      return;
    }

    this.results.push(JSON.parse(resultsEl.innerHTML));

    if ( this.state.currentTest === this.props.tests.length - 1) {
      this.props.finishRun(this.results);
    }
    else {
      this.setState({
	currentTest: this.state.currentTest + 1,
	remindFinishTest: false
      });
    }
  }

  handleRedo() {
    if (typeof document !== 'undefined') {
      document.getElementById('testfile').contentWindow.location.reload();
    }
  }

  render() {
    let { tests, at, browser } = this.props;

    const test = tests[this.state.currentTest];

    if (!at) {
      at = 'JAWS';
    }


    return (
      <Fragment>
        <Head>
          <title>ARIA-AT: Test Run</title>
        </Head>
        <section>
          <p>Screen reader: {at}, browser: {browser}</p>
          <h1>Current test ({this.state.currentTest + 1} of {tests.length}): {test.fullName}</h1>
  	  <iframe id="testfile"
                  src={`../tests${test.location}?at=${at}`}
                  ref={this.testIframe}
          >
  	  </iframe>
          <button onClick={this.handleRedo}>Redo Test</button>
          <button onClick={this.handleSkip}>Skip Test</button>
          <button onClick={this.handleSubmit}>Submit Results</button>
  	{this.state.remindFinishTest && <p className="test-incomplete" tabIndex="0">Current test not completed, finish marking behavior results.</p>}
        </section>
      </Fragment>
    );
  }
}
