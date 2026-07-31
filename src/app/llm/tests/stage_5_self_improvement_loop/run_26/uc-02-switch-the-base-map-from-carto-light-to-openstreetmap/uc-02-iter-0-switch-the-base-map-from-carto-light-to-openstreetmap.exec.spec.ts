// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify initial state: Carto Light is active
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Step 1: Open the base map selector in the layer switcher
  const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapSelector.click();

  // Step 2: Select 'OpenStreetMap'
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results: OpenStreetMap is now the active base map
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
