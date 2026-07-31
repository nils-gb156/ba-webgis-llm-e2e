// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The layer switcher is already visible and pressed by default.
  // Step 1: The user opens the base map selector in the layer switcher.
  // The combobox for basemaps is visible. We click it to open the dropdown.
  await page.getByRole('combobox', { name: 'Basemaps' }).click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We select the option from the combobox list.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveText('OpenStreetMap');
});
