// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  // Navigate to the application
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the layer switcher to be visible (it should be open by default per the context)
  await expect(page.getByTestId('layer-switcher')).toBeVisible();

  // Step 1 & 2: The base map selector is a combobox. We need to interact with it.
  // The accessibility tree shows a combobox "Basemaps" with value "Carto Light".
  // We will click the combobox to open the list, then select "OpenStreetMap".
  
  // Locate the basemaps combobox
  const basemapsCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  
  // Click the combobox to open the dropdown options
  await basemapsCombobox.click();

  // Select 'OpenStreetMap' from the options. 
  // Since it's a combobox, the options might be in a listbox or just selectable via text.
  // We'll try to find the option with text "OpenStreetMap" and click it.
  // Often, selecting from a combobox in Chakra/React can be done by typing or clicking an option.
  // Given the structure, let's look for a list item or option containing "OpenStreetMap".
  
  // Try clicking the text "OpenStreetMap" if it appears as a selectable item.
  // If the combobox expands into a list, we might need to find the list item.
  // However, a safer approach for comboboxes in Playwright is often to click and then select.
  // Let's assume the dropdown opens and we can click the text "OpenStreetMap".
  
  // To avoid strict mode issues, we scope to the layer switcher if possible, 
  // but the combobox itself is the trigger. Let's try clicking the text "OpenStreetMap" directly 
  // after opening the combobox.
  
  // Note: In some implementations, clicking the combobox might not be enough if it's a custom control.
  // But standard combobox behavior suggests options appear.
  
  // Let's attempt to click the text "OpenStreetMap" which should be visible in the dropdown.
  await page.getByText('OpenStreetMap').click();

  // Expected Result: The OpenStreetMap base map is selected.
  // We can verify this by checking the combobox value or the map tiles.
  // Since we can't assert map tiles directly, we assert the combobox state.
  await expect(basemapsCombobox).toHaveValue('OpenStreetMap');
});
