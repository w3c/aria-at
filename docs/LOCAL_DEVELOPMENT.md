# Local Development

## Getting Started

1. Install the dependencies.
   ```
   npm install
   ```
1. Review test contributions as detailed by
   the ["How to contribute tests" Wiki Page](https://github.com/w3c/aria-at/wiki/How-to-contribute-tests).
1. Create a branch dedicated to the upcoming contributions.
   ```
   git checkout -b <contribution_branch_name>
   ```
1. Commit and push your changes.
   ```
   git commit add <files>
   git commit -m <message>
   git push -u <remote> <contribution_branch_name>
   ```
1. Create a Pull Request with the changes from your branch with relevant details associated with it. Ensure the base
   branch is `master`. GitHub Actions should then generate review pages and append a 'Preview Link' to your Pull
   Request's description, so it may be properly reviewed.
1. **NOTE: If any changes were committed to `master` after branching off to a contribution branch, be sure to merge
   those changes back into your branch before submitting your Pull Request for review.**

## Scripts

Scripts and commands available to help with your workflow.

### `npm run build`

Creates or updates the `/build` folder. Runs `npm run create-all-tests` and `npm run review-tests`.

#### Options

- `--testplan=<test_plan>` - Creates or updates the `/build` folder for a specific test plan.
  Runs `npm run create-all-tests -- --testplan=<test_plan>` and `npm run review-tests -- --testplan=<test_plan>` for a
  specific test plan.

### `npm run validate`

Run to confirm that the test plans currently drafted within the project have no validation errors.

#### Options

- `--testplan=<test_plan>` - Run to confirm that a specific test plan currently drafted within the project has no
  validation errors.

### `npm run cleanup`

Removes the `/build` folder from the project. **Note. Will be regenerated by the GitHub Action, or you can
run `npm run build` to do so manually.**

### `npm run create-all-tests`

Generate tests' html and json files as determined by using the files in `/tests/<test_plan>/`. The generated files are
written to `/build/tests/<test_plan>/` by default. **Note that you may not need to run this except for special cases as
running `npm run build` covers this operation.**

#### Options

- `-- --help` - To display script usage text.

- `-- --outputdir=<output_directory>` - Specify folder location that the generated files should be written to. Default
  location is `/build`.

- `-- --testplan=<test_plan>` - Specify test plan that the script must only attempt to generate tests html and json
  files for.

- `-- --verbose` - The script output is more detailed (logs all files that are referenced, tests that are processed,
  absolute paths, etc).

- `-- --validate` - Use to determine whether or not the test plans have any validation errors.

### `npm run review-tests`

Generate review pages based on the previously generated tests' html and json files. Used to navigate the tests. The
generated files are written to `/build/index.html` and `/build/tests/review/` by default. **Note that you may not need
to run this except for special cases as running `npm run build` covers this operation.**

#### Options

- `-- --help` - To display script usage text.

- `-- --outputdir=<output_directory>` - Specify folder location that the generated review pages should be written to.
  Default location is `/build`.

- `-- --testplan=<test_plan>` - Specify test plan that the script must only attempt to generate review pages for.

### `npm run update-reference`

It will copy the latest example html from the aria-practices repo into the project.

## Viewing review pages

1. Run `npm run build` or `npm run build --testplan=<test_plan>`.
1. Open `/build/index.html`.
1. **NOTE: You may revert your local changes, or remove the build folder altogether before pushing if that's preferred.
   The 'Generate and Commit Files' GitHub Action will regenerate
   it. ([See GitHub Action description at Project Structure > .github > workflows > generate-and-commit-files.yml](#project-structure))**

## Project Structure

```
├── .github
│   ├── workflows - contains GitHub Actions
│   │   ├── generate-and-commit-files.yml - generates the test and review pages that are used for the PRs' preview links, which is set by the `update-pr.yml` GitHub Action
│   │   ├── js-lint.yml - automatially lints the repository on a push or pull request if certain files are  changed
│   │   ├── update-pr.yml - updates PR descriptions with a preview link to view the generated test and review  pages created by the `generate-and-commit-files.yml` GitHub Action
├── build
│   ├── review - generated review pages
│   ├── tests - generated tests
│   ├── index.html - entry point for review pages
├── scripts - stores the scripts used for running the project
├── tests - a collection of test plan contributions. Tests and review pages are generated from the test plans written here
│   ├── test_plan_module (eg. checkbox)
│   ├── resources - various utilities useful for generating and interacting with the generated tests and review pages
│   ├── support.json
├── .gitattributes
├── w3c.json
```
