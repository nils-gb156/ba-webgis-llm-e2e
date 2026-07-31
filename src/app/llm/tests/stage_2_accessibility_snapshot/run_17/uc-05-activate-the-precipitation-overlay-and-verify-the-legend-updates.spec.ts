// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher and legend to be visible as per preconditions
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The accessibility tree shows "checkbox Precipitation" in the operational layers list
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click();

  // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: Verify the legend displays an entry corresponding to the Precipitation layer
  // The legend should now contain text related to Precipitation
  await expect(page.getByTestId('legend')).toContainText('Precipitation', { timeout: 10000 });
});
