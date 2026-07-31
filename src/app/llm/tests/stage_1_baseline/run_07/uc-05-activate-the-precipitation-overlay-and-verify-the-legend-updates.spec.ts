// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher (TOC) and legend to be visible
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Locate the Precipitation overlay layer toggle in the layer switcher
  // Assuming the toggle is a checkbox with the label "Precipitation"
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });

  // Check if the toggle is already checked (precondition says it's initially hidden, so it should be unchecked)
  const isChecked = await precipitationToggle.isChecked();
  if (!isChecked) {
    // Click the visibility toggle to show the Precipitation overlay
    await precipitationToggle.click({ force: true });
  }

  // Assert that the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Assert that the legend displays an entry corresponding to the Precipitation layer
  // Assuming the legend entry has a test id or text containing "Precipitation"
  const precipitationLegendEntry = page.getByTestId('legend-precipitation');
  if (precipitationLegendEntry) {
    await expect(precipitationLegendEntry).toBeVisible();
  } else {
    // Fallback to checking for text in the legend
    await expect(legend.getByText('Precipitation')).toBeVisible();
  }
});
