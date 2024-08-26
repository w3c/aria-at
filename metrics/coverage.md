# ARIA-AT Project Coverage

Last updated: November 18, 2021

This document outlines the WAI-ARIA specification coverage by the current test plans within the ARIA-AT project. Looking for other project-related materials? You can view the [ARIA-AT App Test Queue](https://aria-at.w3.org/test-queue), the [ARIA-AT test result reports](https://aria-at.w3.org/reports), or the [collection of all current test plans](https://aria-at.netlify.app). Also see the [ARIA-AT App Home page, at aria-at.w3.org](https://aria-at.w3.org/).

The following shorthand terminology is used throughout:

- ARIA: the [Accessible Rich Internet Applications (WAI-ARIA) specification](https://w3c.github.io/aria/).
- APG: the [WAI-ARIA Authoring Practices guide](https://w3c.github.io/aria-practices/).

Note: for the purposes of coverage measurement, no distinction is made between WAI-ARIA states and properties.

## Project Coverage at a Glance

| Metric                     | Tested (Count) | Tested (Percent) | Total | Notes                                                    |
| -------------------------- | -------------- | ---------------- | ----- | -------------------------------------------------------- |
| APG Design Patterns        | 22             | 73.33%           | 30    | Including "Landmark Regions" section as a single pattern |
| APG Examples               | 45             | 69.2%            | 65    | Including individual landmark region examples            |
| ARIA Roles                 | 40             | 44.94%           | 89    | Not including abstract roles                             |
| ARIA States and Properties | 22             | 41.5%            | 53    | N/A                                                      |

## Project Statistics

- Test plans: 48
- Tests across all plans: 1,260
- Assertions across all tests: 5,021

## APG Design Patterns

<details>
<summary>All APG Design Patterns with at Least one Corresponding ARIA-AT Test Plan</summary>

- [Accordion (Sections With Show/Hide Functionality)](https://w3c.github.io/aria-practices/#accordion)
- [Alert](https://w3c.github.io/aria-practices/#alert)
- [Breadcrumb](https://w3c.github.io/aria-practices/#breadcrumb)
- [Button](https://w3c.github.io/aria-practices/#button)
- [Checkbox](https://w3c.github.io/aria-practices/#checkbox)
- [Combobox](https://w3c.github.io/aria-practices/#combobox)
- [Dialog (Modal)](https://w3c.github.io/aria-practices/#dialog_modal)
- [Disclosure (Show/Hide)](https://w3c.github.io/aria-practices/#disclosure)
- [Grids : Interactive Tabular Data and Layout Containers](https://w3c.github.io/aria-practices/#grid)
- [Landmark Regions](https://w3c.github.io/aria-practices/#aria_landmark)
- [Link](https://w3c.github.io/aria-practices/#link)
- [Listbox](https://w3c.github.io/aria-practices/#Listbox)
- [Menu Button](https://w3c.github.io/aria-practices/#menubutton)
- [Menu or Menu bar](https://w3c.github.io/aria-practices/#menu)
- [Meter](https://w3c.github.io/aria-practices/#meter)
- [Radio Group](https://w3c.github.io/aria-practices/#radiobutton)
- [Slider](https://w3c.github.io/aria-practices/#slider)
- [Slider (Multi-Thumb)](https://w3c.github.io/aria-practices/#slidertwothumb)
- [Spinbutton](https://w3c.github.io/aria-practices/#spinbutton)
- [Switch](https://w3c.github.io/aria-practices/#switch)
- [Table](https://w3c.github.io/aria-practices/#table)
- [Tabs](https://w3c.github.io/aria-practices/#tabpanel)

</details>

## APG Examples

<details>
<summary>All APG Examples with at Least one Corresponding ARIA-AT Test Plan</summary>

- [Accordion Example](https://w3c.github.io/aria-practices/examples/accordion/accordion.html)
- [Action Menu Button Example Using aria-activedescendant](https://w3c.github.io/aria-practices/examples/menu-button/menu-button-actions-active-descendant.html)
- [Action Menu Button Example Using element.focus()](https://w3c.github.io/aria-practices/examples/menu-button/menu-button-actions.html)
- [Alert Example](https://w3c.github.io/aria-practices/examples/alert/alert.html)
- [Banner Landmark Example](https://w3c.github.io/aria-practices/examples/landmarks/banner.html)
- [Breadcrumb design pattern example](https://w3c.github.io/aria-practices/examples/breadcrumb/index.html)
- [Button Examples](https://w3c.github.io/aria-practices/examples/button/button.html)
- [Checkbox (Mixed-State) Example](https://w3c.github.io/aria-practices/examples/checkbox/checkbox-mixed.html)
- [Checkbox (Two-State) Example](https://w3c.github.io/aria-practices/examples/checkbox/checkbox.html)
- [Color Viewer Slider Example](https://w3c.github.io/aria-practices/examples/slider/slider-color-viewer.html)
- [Complementary Landmark Example](https://w3c.github.io/aria-practices/examples/landmarks/complementary.html)
- [Contentinfo Landmark Example](https://w3c.github.io/aria-practices/examples/landmarks/contentinfo.html)
- [Data Grid Examples](https://w3c.github.io/aria-practices/examples/grid/dataGrids.html)
- [Date Picker Spin Button Example:](https://w3c.github.io/aria-practices/examples/spinbutton/datepicker-spinbuttons.html)
- [Disclosure (Show/Hide) Navigation Menu with Top-Level Links](https://w3c.github.io/aria-practices/examples/disclosure/disclosure-navigation-hybrid.html)
- [Disclosure (Show/Hide) Navigation Menu](https://w3c.github.io/aria-practices/examples/disclosure/disclosure-navigation.html)
- [Disclosure (Show/Hide) of Answers to Frequently Asked Questions](https://w3c.github.io/aria-practices/examples/disclosure/disclosure-faq.html)
- [Disclosure (Show/Hide) of Image Description](https://w3c.github.io/aria-practices/examples/disclosure/disclosure-image-description.html)
- [Editable Combobox with Both List and Inline Autocomplete](https://w3c.github.io/aria-practices/examples/combobox/combobox-autocomplete-both.html)
- [Editable Combobox with List Autocomplete](https://w3c.github.io/aria-practices/examples/combobox/combobox-autocomplete-list.html)
- [Editable Combobox Without Autocomplete](https://w3c.github.io/aria-practices/examples/combobox/combobox-autocomplete-none.html)
- [Editor Menubar Example](https://w3c.github.io/aria-practices/examples/menubar/menubar-editor.html)
- [Form Landmark Example](https://w3c.github.io/aria-practices/examples/landmarks/form.html)
- [Layout Grid Examples](https://w3c.github.io/aria-practices/examples/grid/LayoutGrids.html)
- [Link Examples](https://w3c.github.io/aria-practices/examples/link/link.html)
- [Listbox Example with Grouped Options](https://w3c.github.io/aria-practices/examples/listbox/listbox-grouped.html)
- [Main Landmark Example](https://w3c.github.io/aria-practices/examples/landmarks/main.html)
- [Media Seek Slider Example](https://w3c.github.io/aria-practices/examples/slider/slider-seek.html)
- [Meter Example](https://w3c.github.io/aria-practices/examples/meter/meter.html)
- [Modal Dialog Example](https://w3c.github.io/aria-practices/examples/dialog-modal/dialog.html)
- [Multi-Thumb Slider Examples](https://w3c.github.io/aria-practices/examples/slider/slider-multithumb.html)
- [Navigation Landmark Example](https://w3c.github.io/aria-practices/examples/landmarks/navigation.html)
- [Navigation Menu Button](https://w3c.github.io/aria-practices/examples/menu-button/menu-button-links.html)
- [Radio Group Example Using aria-activedescendant](https://w3c.github.io/aria-practices/examples/radio/radio-activedescendant.html)
- [Radio Group Example Using Roving tabindex](https://w3c.github.io/aria-practices/examples/radio/radio.html)
- [Rating Slider Example](https://w3c.github.io/aria-practices/examples/slider/slider-rating.html)
- [Region Landmark Example](https://w3c.github.io/aria-practices/examples/landmarks/region.html)
- [Scrollable Listbox Example](https://w3c.github.io/aria-practices/examples/listbox/listbox-scrollable.html)
- [Search Landmark Example](https://w3c.github.io/aria-practices/examples/landmarks/search.html)
- [Select-Only Combobox](https://w3c.github.io/aria-practices/examples/combobox/combobox-select-only.html)
- [Switch Example](https://w3c.github.io/aria-practices/examples/switch/switch.html)
- [Table Example](https://w3c.github.io/aria-practices/examples/table/table.html)
- [Tabs With Automatic Activation](https://w3c.github.io/aria-practices/examples/tabs/tabs-1/tabs.html)
- [Tabs With Manual Activation](https://w3c.github.io/aria-practices/examples/tabs/tabs-2/tabs.html)
- [Vertical Temperature Slider Example](https://w3c.github.io/aria-practices/examples/slider/slider-temperature.html)

</details>

## ARIA Roles

<details>
<summary>All ARIA Roles Targeted by at Least one ARIA-AT Assertion</summary>

- [alert](https://w3c.github.io/aria/#alert)
- [banner](https://w3c.github.io/aria/#banner)
- [button](https://w3c.github.io/aria/#button)
- [cell](https://w3c.github.io/aria/#cell)
- [checkbox](https://w3c.github.io/aria/#checkbox)
- [columnheader](https://w3c.github.io/aria/#columnheader)
- [combobox](https://w3c.github.io/aria/#combobox)
- [complementary](https://w3c.github.io/aria/#complementary)
- [contentinfo](https://w3c.github.io/aria/#contentinfo)
- [dialog](https://w3c.github.io/aria/#dialog)
- [form](https://w3c.github.io/aria/#form)
- [grid](https://w3c.github.io/aria/#grid)
- [gridcell](https://w3c.github.io/aria/#gridcell)
- [group](https://w3c.github.io/aria/#group)
- [heading](https://w3c.github.io/aria/#heading)
- [link](https://w3c.github.io/aria/#link)
- [listbox](https://w3c.github.io/aria/#listbox)
- [main](https://w3c.github.io/aria/#main)
- [menu](https://w3c.github.io/aria/#menu)
- [menubar](https://w3c.github.io/aria/#menubar)
- [menuitem](https://w3c.github.io/aria/#menuitem)
- [menuitemcheckbox](https://w3c.github.io/aria/#menuitemcheckbox)
- [menuitemradio](https://w3c.github.io/aria/#menuitemradio)
- [meter](https://w3c.github.io/aria/#meter)
- [navigation](https://w3c.github.io/aria/#navigation)
- [none](https://w3c.github.io/aria/#none)
- [option](https://w3c.github.io/aria/#option)
- [radio](https://w3c.github.io/aria/#radio)
- [radiogroup](https://w3c.github.io/aria/#radiogroup)
- [region](https://w3c.github.io/aria/#region)
- [row](https://w3c.github.io/aria/#row)
- [rowgroup](https://w3c.github.io/aria/#rowgroup)
- [search](https://w3c.github.io/aria/#search)
- [slider](https://w3c.github.io/aria/#slider)
- [spinbutton](https://w3c.github.io/aria/#spinbutton)
- [switch](https://w3c.github.io/aria/#switch)
- [tab](https://w3c.github.io/aria/#tab)
- [table](https://w3c.github.io/aria-practices/#table)
- [tablist](https://w3c.github.io/aria/#tablist)
- [tabpanel](https://w3c.github.io/aria/#tabpanel)

</details>

## ARIA States and Properties

<details>
<summary>All ARIA States and Properties Targeted by at Least one ARIA-AT Assertion</summary>

- [aria-activedescendant](https://w3c.github.io/aria/#aria-activedescendant)
- [aria-atomic](https://w3c.github.io/aria/#aria-atomic)
- [aria-autocomplete](https://w3c.github.io/aria/#aria-autocomplete)
- [aria-checked](https://w3c.github.io/aria/#aria-checked)
- [aria-controls](https://w3c.github.io/aria/#aria-controls)
- [aria-current](https://w3c.github.io/aria/#aria-current)
- [aria-describedby](https://w3c.github.io/aria/#aria-describedby)
- [aria-disabled](https://w3c.github.io/aria/#aria-disabled)
- [aria-expanded](https://w3c.github.io/aria/#aria-expanded)
- [aria-haspopup](https://w3c.github.io/aria/#aria-haspopup)
- [aria-hidden](https://w3c.github.io/aria/#aria-hidden)
- [aria-label](https://w3c.github.io/aria/#aria-label)
- [aria-labelledby](https://w3c.github.io/aria/#aria-labelledby)
- [aria-live](https://w3c.github.io/aria/#aria-live))
- [aria-modal](https://w3c.github.io/aria/#aria-modal)
- [aria-orientation](https://w3c.github.io/aria/#aria-orientation)
- [aria-pressed](https://w3c.github.io/aria/#aria-pressed)
- [aria-selected](https://w3c.github.io/aria/#aria-selected)
- [aria-valuemax](https://w3c.github.io/aria/#aria-valuemax)
- [aria-valuemin](https://w3c.github.io/aria/#aria-valuemin)
- [aria-valuenow](https://w3c.github.io/aria/#aria-valuenow)
- [aria-valuetext](https://w3c.github.io/aria/#aria-valuetext)

</details>
