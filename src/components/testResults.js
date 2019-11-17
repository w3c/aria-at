import React, { Component, Fragment } from 'react';
import { createPortal } from 'react-dom';

export default class testResults extends Component {

  constructor(props) {
    super(props);
  }

  render() {
    let { results, at, browser } = this.props;
    console.log(testResults);

    return (
      <h1>Results!!</h1>
    );
  }
}
