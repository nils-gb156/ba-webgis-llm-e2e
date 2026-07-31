// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Ensure layer switcher is open (it is by default per context, but we ensure state)
  const layerSwitcherToggle = page.getByRole('button', { name: 'Layer Switcher' });
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Assert layer switcher is visible
  await expect(layerSwitcher).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // The combobox "Basemaps" is the selector.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  
  // Click the combobox to open the list of base maps
  await basemapCombobox.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // Select the option from the listbox
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results:
  // The OpenStreetMap base map is selected.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
