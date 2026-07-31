// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('UC2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify the initial base map is Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // The layer switcher is already visible. Open the base map selector.
  const baseMapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await baseMapSelector.click();

  // Select OpenStreetMap from the dropdown options
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Verify the active base map is now OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
