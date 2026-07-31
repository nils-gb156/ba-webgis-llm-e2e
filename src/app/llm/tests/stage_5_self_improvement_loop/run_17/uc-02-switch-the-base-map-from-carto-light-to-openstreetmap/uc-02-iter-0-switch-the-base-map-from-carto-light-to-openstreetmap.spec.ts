// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Carto Light is active by default
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher toggle is already pressed (open) by default.
  const baseMapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await baseMapSelector.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results: The OpenStreetMap base map is selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

  // Expected results: The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
