// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the map to be ready
  await page.getByTestId('map-container').waitFor({ state: 'visible' });

  // The layer switcher is already visible and open by default according to the context.
  // Step 1: The user opens the base map selector in the layer switcher.
  // The combobox "Basemaps" is already visible. We just need to interact with it.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await expect(basemapCombobox).toBeVisible();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We click the combobox to open the dropdown, then select the option.
  await basemapCombobox.click();
  
  // Wait for the dropdown options to appear. They are typically list items or buttons.
  // Since there's no specific test id for the options, we use getByRole with the name.
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  // We assert that the combobox value has changed to OpenStreetMap.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
