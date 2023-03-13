---
name: Vispero Candidate Phase Review
about: Issue to gather feedback from Vispero relating to a specific test plan
title: 'Candidate review: Test Plan Name (Vispero)'
labels: Vispero, Candidate Review
assignees: RFischer-FS

---

#### Candidate review scope
* Vendor: Vispero
* Test plan: Test Plan Name
* Published test report: URL
* Aim: gather any feedback and/or questions on the state of the test plan, including testing task scope, instructions, included commands, applicable assertions, and anything else believed to be a relevant concern.

Note: we are currently designing and implementing specific workflows and tools within the ARIA-AT Application to assist AT vendors with future reviews.  In the meantime, leaving feedback on this issue directly is encouraged, or alternatively new issues can be raised using the existing facilities in the app.

#### Overview
The recommended starting point for the review is the published test report, available at the URL listed earlier in this issue.  The report page includes high-level results for all AT/browser combinations that were tested, allowing the full data set to be explored and comparisons to be made between support levels.

Specifically, each combination is represented by a table, with one row per testing task.  Each row conveys the following:
* the name of the individual testing task;
* the total number of required assertions, plus how many were recorded as passing;
* the total number of optional assertions, plus how many were recorded as passing; and
* the number of additional, unexpected/undesirable behaviours recorded by testers (such as excess screen reader verbosity).

Every test name acts as a link to view more detailed results, as does the "View Complete Results" link before each table.  For each test, the details page includes:
* A "Raise an Issue" link, to file specific feedback on GitHub.  Again, feedback may be recorded in this issue instead if preferred.
* An "Open Test" page, to view the full testing form that was completed by our testers.  This form also includes the "Open Test Page" button; use this to view the final version of the APG example used as the test case.
* A table of expanded results for each testing command, including:
	* command key(s);
	* support level;
	* specific screen reader output; and
	* enumerations of all passing assertions, failing assertions, and unexpected/undesirable behaviours.
* A "Run History" disclosure button, facilitating access to AT and browser information and testing dates.

Note that the original APG example can also be accessed from the high-level report page, but this version may have been modified slightly to better support the purposes of the ARIA-AT project and its testers.  Such changes are not substantive, and do not have any impact on results.  The version under test can always be accessed from an individual test page as already described.

Finally, it may be helpful to reference the project's [Working Mode](https://github.com/w3c/aria-at/wiki/Working-Mode), which describes the testing phases in detail.

CC @RFischer-FS
