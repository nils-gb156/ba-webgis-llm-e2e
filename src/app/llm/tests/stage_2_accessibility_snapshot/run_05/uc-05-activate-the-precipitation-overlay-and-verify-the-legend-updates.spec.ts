// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the layer switcher is open to access the Precipitation checkbox
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const isLayerSwitcherOpen = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isLayerSwitcherOpen !== 'true') {
    await layerSwitcherToggle.click();
  }

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer
  // Ensure the legend panel is visible
  const legendToggle = page.getByRole('button', { name: 'Legend Switcher' });
  const isLegendOpen = await legendToggle.getAttribute('aria-pressed');
  if (isLegendOpen !== 'true') {
    await legendToggle.click();
  }

  // Check that the legend contains an entry for Precipitation
  const legendContainer = page.getByTestId('legend');
  await expect(legendContainer.getByText('Precipitation', { exact: false })).toBeVisible();
});
