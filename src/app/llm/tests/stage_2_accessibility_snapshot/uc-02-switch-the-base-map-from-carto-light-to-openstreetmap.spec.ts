// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher to be visible
  await expect(page.getByRole('heading', { name: 'Layer Switcher' })).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // The accessibility tree shows a combobox "Basemaps" with value "Carto Light".
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await expect(basemapCombobox).toBeVisible();
  
  // Click the combobox to open the list of base maps
  await basemapCombobox.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We expect an option or list item with the text "OpenStreetMap" to appear.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected result: The OpenStreetMap base map is selected.
  // We verify that the combobox now displays "OpenStreetMap".
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');

  // Expected result: The Carto Light base map is no longer selected.
  // We verify that "Carto Light" is not the selected value.
  await expect(basemapCombobox).not.toHaveValue('Carto Light');
});
