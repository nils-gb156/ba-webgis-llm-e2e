// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure the layer switcher is open and visible
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const isLayerSwitcherOpen = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isLayerSwitcherOpen !== 'true') {
    await layerSwitcherToggle.click({ force: true });
  }
  await expect(page.getByRole('heading', { name: 'Layer Switcher' })).toBeVisible();

  // Locate the UV-Index layer checkbox.
  // We scope it within the layer switcher list to avoid ambiguity with other "UV-Index" text.
  const layerSwitcherList = page.getByRole('list', { name: 'Operational layers' });
  const uvIndexCheckbox = layerSwitcherList.getByRole('checkbox', { name: 'UV-Index' });

  // The accessibility tree shows UV-Index is unchecked initially.
  await expect(uvIndexCheckbox).not.toBeChecked();

  // Click the checkbox to enable the UV-Index layer.
  // Chakra UI checkboxes require force: true.
  await uvIndexCheckbox.click({ force: true });

  // Verify the checkbox is now checked.
  await expect(uvIndexCheckbox).toBeChecked();

  // Verify that the UV-Index legend is visible, which indicates the layer is loaded and rendered.
  const uvIndexLegend = page.getByTestId('uvi-stations-legend');
  await expect(uvIndexLegend).toBeVisible();

  // Verify the map container is visible (implying the map rendered/updated).
  const mapContainer = page.getByTestId('map-container');
  await expect(mapContainer).toBeVisible();
});
