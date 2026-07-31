// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('UC2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify the initial base layer is Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Open the base map selector in the layer switcher
  const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapSelector.click();

  // Select 'OpenStreetMap' from the dropdown list
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Verify the active base layer has changed to OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
