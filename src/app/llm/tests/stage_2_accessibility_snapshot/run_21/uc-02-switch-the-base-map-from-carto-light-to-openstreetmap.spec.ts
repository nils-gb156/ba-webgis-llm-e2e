// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible, ensuring the application is loaded.
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher is already visible and pressed according to the context.
  // The combobox for basemaps is identified by its accessible name "Basemaps".
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });

  // Open the combobox to reveal the options.
  await basemapCombobox.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // Select the option with the exact text 'OpenStreetMap'.
  await page.getByRole('option', { name: 'OpenStreetMap', exact: true }).click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  // We verify that the combobox now displays 'OpenStreetMap'.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
