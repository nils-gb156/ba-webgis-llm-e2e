// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher toggle to be in the pressed state (visible)
  await expect(page.getByRole('button', { name: 'Layer Switcher' })).toBePressed();

  // The base map selector is a combobox. Clicking it opens the list of options.
  // We use force: true because Chakra UI comboboxes can have overlay elements.
  const baseMapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await baseMapCombobox.click({ force: true });

  // Select 'OpenStreetMap' from the dropdown list.
  // Chakra UI Combobox renders options as list items within the combobox's popup.
  await page.getByRole('option', { name: 'OpenStreetMap' }).click();

  // Assert that the combobox now reflects the new selection
  await expect(baseMapCombobox).toHaveText('OpenStreetMap');

  // Assert that Carto Light is no longer selected (it won't be in the combobox text)
  await expect(baseMapCombobox).not.toHaveText('Carto Light');
});
