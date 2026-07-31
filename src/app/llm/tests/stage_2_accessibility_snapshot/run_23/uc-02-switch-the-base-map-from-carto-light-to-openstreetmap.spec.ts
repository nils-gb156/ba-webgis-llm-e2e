// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher to be visible (it is open by default)
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // The combobox "Basemaps" is already visible. We click it to open the dropdown.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapCombobox.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We look for the list item or option containing "OpenStreetMap".
  // Since it's a combobox, the options might be in a listbox or just visible options.
  // We'll try to click the text "OpenStreetMap" within the context of the layer switcher.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results:
  // The OpenStreetMap base map is selected.
  // The Carto Light base map is no longer selected.
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveText(/OpenStreetMap/i);
});
