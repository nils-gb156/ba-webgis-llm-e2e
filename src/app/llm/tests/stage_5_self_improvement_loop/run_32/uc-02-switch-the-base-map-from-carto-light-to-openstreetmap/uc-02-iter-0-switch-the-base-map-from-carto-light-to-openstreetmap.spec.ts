// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify initial state: Carto Light is active
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // The layer switcher is already visible and the base map combobox is visible.
  // Select 'OpenStreetMap' from the basemaps dropdown.
  await page.getByRole('combobox', { name: 'Basemaps' }).selectOption('OpenStreetMap');

  // Verify the base map has switched to OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
