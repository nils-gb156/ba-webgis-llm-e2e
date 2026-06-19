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
- Begin the test by navigating to the base URL given in the prompt
  (`await page.goto(...)`).

## Locators

- Address elements by user-facing properties: `getByRole`, `getByText`, `getByLabel`.
- Use `getByTestId` when a test id is available.
- Do not use CSS selectors or XPath bound to the DOM structure.

## Waiting and assertions

- Use `async`/`await` for every Playwright call.
- Use web-first, auto-retrying `expect` assertions
  (e.g. `await expect(locator).toBeVisible()`).
- Do not use fixed waits (no `waitForTimeout`, no `sleep`).
- For steps that depend on network responses or page loads, use
  `waitForResponse` / `waitForLoadState`.
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
