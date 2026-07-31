// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the initial layers and legend to settle
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is already open (Layer Switcher button is pressed).
  // The Precipitation checkbox is currently unchecked.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).not.toBeChecked();
  
  // Use force: true because Chakra UI checkboxes have a hidden input
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer
  // The legend should now contain a heading or text related to "Precipitation"
  await expect(page.getByTestId('legend').getByText(/Precipitation/i, { exact: false })).toBeVisible();
});
