// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('UC2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Carto Light is active by default, layer switcher is visible
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveValue('Carto Light');

  // Step 1: The user opens the base map selector in the layer switcher.
  await page.getByRole('combobox', { name: 'Basemaps' }).click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results: The OpenStreetMap base map is selected.
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveValue('OpenStreetMap');

  // Expected results: The OpenStreetMap base map is now rendered on the map.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
