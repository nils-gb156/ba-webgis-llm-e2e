// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Layer switcher is visible and Carto Light is active.
  // The accessibility tree shows the layer switcher is already open ("Layer Switcher" [pressed]).
  // We verify the current base map is Carto Light.
  const baseMapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await expect(baseMapSelector).toBeVisible();
  await expect(baseMapSelector).toHaveValue('Carto Light');

  // Step 1: The user opens the base map selector in the layer switcher.
  // Since it's a combobox, clicking it opens the dropdown.
  await baseMapSelector.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We look for the option with the text "OpenStreetMap".
  const openStreetMapOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(openStreetMapOption).toBeVisible();
  await openStreetMapOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect(baseMapSelector).toHaveValue('OpenStreetMap');
});
