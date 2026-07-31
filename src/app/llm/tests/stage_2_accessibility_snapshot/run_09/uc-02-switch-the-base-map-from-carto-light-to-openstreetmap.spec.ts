// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher toggle to be visible (it should be pressed/open by default)
  await expect(page.getByRole('button', { name: 'Layer Switcher' })).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // The combobox for basemaps is already visible in the accessibility tree.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapCombobox.click();

  // Wait for the dropdown options to appear
  await expect(page.getByRole('option', { name: 'OpenStreetMap' })).toBeVisible();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
