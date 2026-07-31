// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // The layer switcher is already visible and open based on preconditions.
  // The base map selector is a combobox.
  const baseMapSelector = page.getByRole('combobox', { name: 'Basemaps' });

  // Click the combobox to open the list of base maps.
  await baseMapSelector.click();

  // Select 'OpenStreetMap' from the dropdown.
  // Since it's a combobox, options might be in a listbox or as text in the dropdown.
  // We try to click the text "OpenStreetMap" within the context of the layer switcher or the combobox.
  // Using getByText with exact match scoped to the layer switcher is a robust approach for dropdowns.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await layerSwitcher.getByText('OpenStreetMap', { exact: true }).click();

  // Assert that the selected base map is now OpenStreetMap.
  await expect(baseMapSelector).toHaveValue('OpenStreetMap');
});
