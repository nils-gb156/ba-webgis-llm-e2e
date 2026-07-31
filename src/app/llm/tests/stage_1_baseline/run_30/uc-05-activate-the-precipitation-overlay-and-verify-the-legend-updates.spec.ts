// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the TOC/Legend to be visible
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Locate the Precipitation overlay toggle in the layer switcher.
  // Assuming the checkbox for the Precipitation layer has a specific test id or accessible name.
  // If no specific test id is known, we rely on the accessible name "Precipitation".
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });

  // Ensure the toggle is currently unchecked (precondition)
  await expect(precipitationToggle).not.toBeChecked();

  // Click the visibility toggle to show the Precipitation overlay
  // Using force: true because Chakra UI checkboxes render the input visually hidden
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // We look for a legend item that contains the text "Precipitation"
  const legendEntry = page.getByRole('listitem', { name: 'Precipitation' });
  
  // The legend entry might take a moment to appear after the layer is activated
  await expect(legendEntry).toBeVisible();
});
