// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher to be visible and the initial base map to be Carto Light
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  await expect(layerSwitcherToggle).toBeVisible();

  // The layer switcher is already open and Carto Light is selected by default.
  // We need to change the selection to OpenStreetMap.
  // The base map selector is a combobox.
  const baseMapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await expect(baseMapSelector).toBeVisible();

  // Select OpenStreetMap from the combobox
  await baseMapSelector.selectOption('OpenStreetMap');

  // Verify that the base map selector now shows OpenStreetMap
  await expect(baseMapSelector).toHaveValue('OpenStreetMap');
});
