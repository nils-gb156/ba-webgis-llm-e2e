// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the TOC/Legend to be visible
  await expect(page.getByTestId('toc')).toBeVisible({ timeout: 30000 });
  await expect(page.getByTestId('legend')).toBeVisible({ timeout: 30000 });

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // Assuming the Precipitation layer has a test id for its toggle or is identifiable by its label
  // We look for a checkbox or switch associated with "Precipitation"
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true }).or(
    page.getByRole('switch', { name: 'Precipitation', exact: true })
  );

  // It's possible the layer is hidden initially, so we might need to expand a group if applicable.
  // However, based on the prompt, the TOC is visible and we just need to click the toggle.
  // Using force: true because Chakra UI controls often have hidden inputs.
  await precipitationToggle.click({ force: true });

  // Step 2: Verify the legend displays an entry corresponding to the Precipitation layer
  // We assert that the legend now contains text or an element related to "Precipitation"
  await expect(page.getByTestId('legend')).toContainText('Precipitation', { timeout: 10000 });

  // Verify the toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();
});
