// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure layer switcher is open to interact with the Precipitation checkbox
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const isLayerSwitcherOpen = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isLayerSwitcherOpen !== 'true') {
    await layerSwitcherToggle.click();
  }

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // Step 2: View the legend
  // Ensure legend is visible
  const legendToggle = page.getByRole('button', { name: 'Legend Switcher' });
  const isLegendOpen = await legendToggle.getAttribute('aria-pressed');
  if (isLegendOpen !== 'true') {
    await legendToggle.click();
  }

  // Expected result: The Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Expected result: The legend displays an entry corresponding to the Precipitation layer.
  // We look for "Precipitation" text within the legend container.
  const legend = page.getByTestId('legend');
  await expect(legend.getByText(/Precipitation/i, { exact: false })).toBeVisible();
});
