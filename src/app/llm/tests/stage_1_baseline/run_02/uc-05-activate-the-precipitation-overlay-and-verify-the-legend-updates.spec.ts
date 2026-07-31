// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher/legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The Precipitation layer is initially hidden, so we need to toggle it on.
  // We use force: true as it's a Chakra UI checkbox/switch control.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await expect(precipitationToggle).toBeChecked({ checked: false });
  await precipitationToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(precipitationToggle).toBeChecked();

  // Step 2: View the legend and verify it displays an entry for the Precipitation layer
  // We expect the legend to contain text related to "Precipitation"
  const legend = page.getByTestId('legend');
  await expect(legend.getByText(/Precipitation/i)).toBeVisible();
});
