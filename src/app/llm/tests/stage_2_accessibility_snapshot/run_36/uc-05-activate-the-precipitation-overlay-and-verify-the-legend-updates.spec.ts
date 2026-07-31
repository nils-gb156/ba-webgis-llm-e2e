// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('UC5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure layer switcher is open
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const isLayerSwitcherOpen = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isLayerSwitcherOpen !== 'true') {
    await layerSwitcherToggle.click({ force: true });
  }

  // Ensure legend is open
  const legendToggle = page.getByRole('button', { name: 'Legend Switcher' });
  const isLegendOpen = await legendToggle.getAttribute('aria-pressed');
  if (isLegendOpen !== 'true') {
    await legendToggle.click({ force: true });
  }

  // Locate the Precipitation checkbox in the layer switcher
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });

  // Check if it's already checked; if not, click it
  const isChecked = await precipitationCheckbox.isChecked();
  if (!isChecked) {
    await precipitationCheckbox.click({ force: true });
  }

  // Wait for the checkbox to be checked to ensure state has settled
  await expect(precipitationCheckbox).toBeChecked();

  // Verify the legend updates to include Precipitation
  // We look for an entry in the legend that corresponds to Precipitation.
  // Since the specific legend text for Precipitation isn't provided in the context,
  // we assert that the legend container has updated content or specifically look for "Precipitation".
  const legend = page.getByTestId('legend');
  
  // Check if the legend contains "Precipitation" text
  await expect(legend.getByText('Precipitation', { exact: false })).toBeVisible({ timeout: 10000 });
});
