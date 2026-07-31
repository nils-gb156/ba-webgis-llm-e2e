// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The layer switcher is visible by default, with Carto Light selected.
  // Click the combobox to open the base map selector.
  await page.getByRole('combobox', { name: 'Basemaps' }).click();

  // Select 'OpenStreetMap' from the dropdown list.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Verify that the active base layer is now OpenStreetMap.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
