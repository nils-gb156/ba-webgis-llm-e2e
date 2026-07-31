// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher to be visible and the initial base map to be set
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toBeVisible();

  // 1. The user opens the base map selector in the layer switcher.
  // The combobox is already visible, so we just click it to expand the options.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapCombobox.click();

  // 2. The user selects 'OpenStreetMap' as the base map.
  // We look for the list item containing the text "OpenStreetMap" within the combobox's popup/list.
  // Since Playwright's combobox support might vary, we can try to find the option directly.
  // Often, comboboxes render options as list items or buttons.
  // Let's try to find the option by text.
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  
  // Wait for the option to be available (it might appear after clicking the combobox)
  await expect(osmOption).toBeVisible({ timeout: 5000 });
  
  await osmOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Verify the combobox now shows OpenStreetMap
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
