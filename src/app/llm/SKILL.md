# OPT Playwright Test Generation — Skill

You generate end-to-end tests for a web application using Playwright with TypeScript.
These conventions are fixed and apply to every test you produce.

## Output

- Return exactly ONE Playwright test file as valid TypeScript and nothing else.
- No markdown code fences, no explanation before or after the code.
- The first two lines must be the SPDX license header:
    ```
    // SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
    // SPDX-License-Identifier: Apache-2.0
    ```
- Followed by: `import { test, expect } from '@playwright/test';`
- Use a single `test(...)` block. The test title must contain the use case id and title.
- Do not use `test.describe`, `test.beforeEach`, or custom fixtures. All logic,
  including precondition checks, belongs in the single test body.
- Begin the test by navigating to the base URL given in the prompt
  (`await page.goto(...)`).

## Locators

## Locators

- Prefer `getByTestId` whenever a test id is available — test ids are stable
  and unambiguous.
- Fall back to user-facing properties (`getByRole`, `getByText`, `getByLabel`)
  only for elements without a test id. Prefer `getByRole` with an accessible
  name over `getByText`, as plain text matches are often ambiguous.
- Do not use CSS selectors or XPath bound to the DOM structure.
- If an element has no accessible role, label, visible text, or test id, a
  scoped CSS class selector may be used as a last resort.
- Chakra UI form controls (checkbox, switch, radio) render the real
  `role`-bearing `<input>` visually hidden underneath a decorative control
  element (`chakra-checkbox__control` etc.) that intercepts pointer events.
  Clicking the `getByRole('checkbox' | 'switch' | 'radio')` locator therefore
  hangs until timeout ("… intercepts pointer events"). Use
  `click({ force: true })` on the role locator to toggle such a control, and
  assert the result separately (`toBeChecked()`). Do not switch to
  `getByText()` for clicking — visible label texts are often ambiguous
  (headings, list items) and cause strict mode violations.

## Waiting and assertions

- Use `async`/`await` for every Playwright call.
- Use web-first, auto-retrying `expect` assertions
  (e.g. `await expect(locator).toBeVisible()`).
- For asynchronous values that are not covered by Playwright's built-in
  auto-retrying assertions (e.g. values read from application state rather
  than the DOM), use `expect.poll(() => ...)` instead of a single
  `expect(await ...)`, since the latter evaluates the value only once and
  does not wait for it to settle.
- Do not use fixed waits (no `waitForTimeout`, no `sleep`).
- For steps that depend on network responses or page loads, use
  `waitForResponse` / `waitForLoadState`.
- To verify that a specific network request was sent, register a `page.on('request', ...)`
  listener before performing the triggering action, then assert on the captured
  request (e.g. with `expect.poll()`).
- For actions that trigger a file download, call `page.waitForEvent('download')`
  before performing the triggering action, then await the resulting download
  and assert on it (e.g. `suggestedFilename()`).
- Derive the assertions from the `expected_result` field of the use case.
- Cover the steps in order as a single user flow.

## Application under test (framework-level background)

- The application is built with Open Pioneer Trails (React + Chakra UI, TypeScript).
- The map is rendered with OpenLayers onto an HTML `<canvas>`. Map content — the active
  layers, features, zoom level and map position — is NOT represented as DOM elements and
  therefore cannot be asserted through DOM locators.
- Open Pioneer Trails components follow ARIA conventions and can expose a `data-testid`.
  Test ids are not assigned automatically; they exist only where set in the application code.
- Geodata (map tiles, WMS layers, GetFeatureInfo, geocoder requests) load asynchronously
  over the network and appear only after the response has arrived.
