// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher to be visible and the initial base map to be set.
  // The accessibility tree indicates the layer switcher is open by default.
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveValue('Carto Light');

  // Open the base map selector (combobox)
  await page.getByRole('combobox', { name: 'Basemaps' }).click();

  // Select 'OpenStreetMap' from the dropdown options
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Assert that OpenStreetMap is now selected
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveValue('OpenStreetMap');
});
