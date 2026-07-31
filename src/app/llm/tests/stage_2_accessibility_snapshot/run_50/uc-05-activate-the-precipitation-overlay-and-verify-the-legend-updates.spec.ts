// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is already visible and the Precipitation checkbox is unchecked.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer
  // The legend is already visible. We need to check for a new entry in the legend list.
  // We use expect.poll to wait for the legend content to update asynchronously.
  await expect.poll(async () => {
    const legendLocator = page.getByTestId('legend');
    const textContent = await legendLocator.textContent();
    return textContent;
  }).toContain('Precipitation');
});
