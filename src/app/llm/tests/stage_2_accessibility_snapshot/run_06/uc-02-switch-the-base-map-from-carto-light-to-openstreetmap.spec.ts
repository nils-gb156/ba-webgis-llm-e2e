// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher toggle is already pressed (open) based on the accessibility tree.
  // We need to interact with the combobox "Basemaps" to change the selection.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapCombobox.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // The combobox likely opens a list or dropdown. We look for the option "OpenStreetMap".
  // Since it's a combobox, we might need to type or select from a list.
  // Given the context, it's likely a dropdown list. We'll try to select the text directly.
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(osmOption).toBeVisible();
  await osmOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect(basemapCombobox).toHaveValue('OpenStreetMap');
});
