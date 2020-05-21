# ARIA and Assistive Technologies (ARIA-AT)

This repo contains a test suite and harness for assessing assistive technology (AT)  support of ARIA. These tests are designed to be modular and embeddable in higher-level applications. A web app for managing  test cycles and reporting test results ([ARIA-AT-App](https://github.com/bocoup/aria-at-app)) is also being developed and is planned to be available on w3.org in June 2020.

## Scope and Method

The initial scope of this test suite is manual testing of a select set of desktop screen readers. Tests are written as assertions of expected screen reader behavior when using example implementations of design patterns in the [ARIA Authoring Practices Guide](https://w3c.github.io/aria-practices/examples/).

## Running the tests

This repo includes a [prototype runner](https://w3c.github.io/aria-at/runner) that you can use to run the manual tests. Production runs of the  tests to produce validated reports  will be  run with [ARIA-AT-App](https://github.com/bocoup/aria-at-app).

## Documentation

[Documentation is available in the wiki](https://github.com/w3c/aria-at/wiki).

## Get involved

You can participate by:

* Joining the [community group](https://www.w3.org/community/aria-at/)
* [Signing up as a tester](https://github.com/w3c/aria-at/issues/162) for the Pilot Test (May 27 - June 2)
* [Reviewing assertions of existing test plans](https://w3c.github.io/aria-at/review-test-plans/)
* [Writing more tests](https://github.com/w3c/aria-at/wiki/How-to-contribute-tests)
* Fixing a [good first issue](https://github.com/w3c/aria-at/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22)

This project is managed by the [Authoring Practices Task Force](https://www.w3.org/WAI/ARIA/task-forces/practices/) of the [ARIA Working Group](http://www.w3.org/WAI/ARIA/). The W3C staff contact is [Michael Cooper](http://www.w3.org/People/cooper/).

## Conduct

All contributors to this project are expected to adhere to the [W3C Code of Ethics and Professional Conduct](https://www.w3.org/Consortium/cepc/).

## License

All documents in this Repository are licensed by contributors under the [W3C Document License](https://www.w3.org/Consortium/Legal/2015/doc-license).
