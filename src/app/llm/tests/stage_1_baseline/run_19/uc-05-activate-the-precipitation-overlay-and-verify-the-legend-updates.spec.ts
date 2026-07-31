// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Locate the Precipitation layer toggle.
  // Assuming the layer item has a test id or we can find it by text.
  // We look for the checkbox associated with "Precipitation".
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });

  // Ensure the toggle is initially unchecked (hidden) as per preconditions
  await expect(precipitationToggle).not.toBeChecked();

  // Step 1: Click the visibility toggle to show the Precipitation overlay
  // Using force: true because Chakra UI checkboxes render the input visually hidden
  await precipitationToggle.click({ force: true });

  // Step 2: Verify the toggle is now checked
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Verify the legend updates to include the Precipitation layer
  // Assuming the legend container has a test id or we can find it by role/text
  const legendContainer = page.getByTestId('legend');
  await expect(legendContainer).toBeVisible();

  // Check that the legend contains an entry for Precipitation
  // This might be a specific element within the legend container
  const precipitationLegendEntry = legendContainer.getByText('Precipitation');
  await expect(precipitationLegendEntry).toBeVisible();
});
