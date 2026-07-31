// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher is already visible and the toggle is pressed.
  // We need to interact with the combobox for basemaps.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapCombobox.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We look for the option in the combobox list.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results: The OpenStreetMap base map is selected.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
