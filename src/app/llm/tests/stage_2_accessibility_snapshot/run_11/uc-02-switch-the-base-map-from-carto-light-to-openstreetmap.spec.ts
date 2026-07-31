// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to be ready and the layer switcher to be visible.
  // The context indicates the Layer Switcher button is already pressed/visible.
  await expect(page.getByRole('button', { name: 'Layer Switcher' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Layer Switcher' })).toBeVisible();

  // Step 1: The user opens the base map selector in the layer switcher.
  // The combobox "Basemaps" is already visible in the accessibility tree.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await expect(basemapCombobox).toBeVisible();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  await basemapCombobox.selectOption('OpenStreetMap');

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
