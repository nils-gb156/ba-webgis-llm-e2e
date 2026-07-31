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

  // Locate the Precipitation overlay toggle in the layer switcher.
  // Assuming the toggle is a checkbox with label "Precipitation" or similar.
  // Using getByRole with exact name to avoid ambiguity if other elements share text.
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  // Check if the toggle is already checked. If not, click it.
  const isChecked = await precipitationToggle.isChecked();
  if (!isChecked) {
    await precipitationToggle.click({ force: true });
  }

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Verify the legend displays an entry corresponding to the Precipitation layer.
  // Assuming the legend entry has a test id or text related to "Precipitation".
  const precipitationLegendEntry = legend.getByText('Precipitation');
  await expect(precipitationLegendEntry).toBeVisible();
});
