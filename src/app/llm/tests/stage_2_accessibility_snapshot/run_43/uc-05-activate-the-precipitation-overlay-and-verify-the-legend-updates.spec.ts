// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher and legend to be visible as per preconditions
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The checkbox for "Precipitation" is visible in the layer switcher list
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend and verify it displays an entry for the Precipitation layer
  // The legend should update to include the Precipitation layer entry
  // We poll the legend content to ensure the async update has completed
  await expect.poll(() => page.getByTestId('legend').innerText()).toContain('Precipitation');
});
