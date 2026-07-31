// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  // Navigate to the base URL
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map container to be visible to ensure the app is loaded
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher toggle is already pressed (visible) based on the context.
  // We need to interact with the combobox for "Basemaps".
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // Clicking the combobox should open the dropdown list.
  await basemapCombobox.click();

  // Wait for the option 'OpenStreetMap' to be visible and then click it.
  // Since the combobox might be a custom component, we look for the text in the vicinity or use the accessible name if available.
  // Based on the accessibility tree, we have a combobox. Playwright's click on a combobox usually opens the list.
  // We then select the option. If it's a standard HTML select or accessible list, getByRole('option') works.
  // If it's a custom list, we might need to rely on text or test ids. Let's try to find the option by text.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Assert that the combobox now shows OpenStreetMap as the selected value.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
