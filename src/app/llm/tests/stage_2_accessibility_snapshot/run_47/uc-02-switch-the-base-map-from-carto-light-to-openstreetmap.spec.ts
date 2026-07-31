// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Preconditions: Layer switcher is visible and Carto Light is active.
  // The accessibility tree shows the layer switcher is already open/pressed.
  // We assert the initial state to be sure.
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveValue('Carto Light');

  // Step 1: Open the base map selector (it is already open, but we ensure interaction).
  // Step 2: Select 'OpenStreetMap' as the base map.
  // Using force: true as comboboxes in Chakra can sometimes have pointer-events issues.
  await page.getByRole('combobox', { name: 'Basemaps' }).click({ force: true });

  // Wait for the dropdown options to appear and select OpenStreetMap.
  // We look for the text "OpenStreetMap" within the combobox's listbox/options.
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(osmOption).toBeVisible();
  await osmOption.click();

  // Expected results: OpenStreetMap is selected, Carto Light is no longer selected.
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveValue('OpenStreetMap');
});
