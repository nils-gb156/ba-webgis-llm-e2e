// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the initial base layer to be Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // 1. Open the base map selector in the layer switcher
  await page.getByRole('combobox', { name: 'Basemaps' }).click();

  // 2. Select 'OpenStreetMap' as the base map
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Verify that OpenStreetMap is now the active base map
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
