// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Layer switcher is visible and Carto Light is active
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveText('Carto Light');

  // Step 1: Open the base map selector in the layer switcher
  const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapSelector.click();

  // Step 2: Select 'OpenStreetMap' as the base map
  // The dropdown options should appear after clicking the combobox.
  // We look for the text "OpenStreetMap" within the combobox's listbox/options.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveText('OpenStreetMap');
});
