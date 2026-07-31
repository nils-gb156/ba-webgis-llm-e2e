// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the application to load and the layer switcher toggle to be visible
  // The accessibility tree indicates the Layer Switcher button is [pressed], meaning it is open
  await expect(page.getByRole('button', { name: 'Layer Switcher' })).toBeVisible();

  // Step 1 & 2: The layer switcher is already open (pressed state).
  // We need to find the combobox for "Basemaps" and select "OpenStreetMap".
  // The accessibility tree shows a combobox with name "Basemaps" and current value "Carto Light".
  
  // Locate the basemap combobox. We can scope it to the layer switcher panel if needed, 
  // but the role/name should be unique enough. If not, we might need to find the container.
  // Let's try to find the combobox by its accessible name.
  const basemapCombobox = page.getByRole('combobox', { name: 'Basemaps' });
  await expect(basemapCombobox).toBeVisible();

  // Click the combobox to open the dropdown options
  await basemapCombobox.click();

  // Select 'OpenStreetMap' from the dropdown. 
  // Since it's a combobox, the option might appear as a list item or option element.
  // We can use getByText to find the option if it appears in the accessibility tree or DOM.
  // Or we can use the combobox's select option method if it's a native select, but Chakra UI often uses custom dropdowns.
  // Let's try to find the text "OpenStreetMap" in the context of the layer switcher.
  
  // The layer switcher is likely in a panel or dialog. The accessibility tree doesn't explicitly show a dialog role for the layer switcher, 
  // but it shows headings and lists. Let's assume the options appear in the DOM near the combobox.
  // We will look for a list item or button with text "OpenStreetMap" within the layer switcher area.
  
  // A safer approach for Chakra UI Combobox is to look for the option in the dropdown list.
  // We can use page.getByText('OpenStreetMap') but we need to ensure it's the option and not some other text.
  // Let's scope it to the layer switcher toggle's parent or the region containing the switcher.
  // The accessibility tree shows "Layer Switcher" as a heading. Let's try to find the combobox's dropdown.
  
  // Alternative: Use the combobox's built-in select if it supports it, or click the specific option.
  // Let's try clicking the option by text within the layer switcher context.
  // We can find the layer switcher container by the heading "Layer Switcher" or the button "Layer Switcher".
  // Since the button is pressed, the panel is open.
  
  const layerSwitcherPanel = page.getByRole('button', { name: 'Layer Switcher' }).locator('..').locator('..'); 
  // This might be fragile. Let's try a broader scope or just getByText if unique.
  // "OpenStreetMap" is likely unique enough in the UI.
  
  // Let's try to find the option by text "OpenStreetMap" and click it.
  // To avoid strict mode violations if "OpenStreetMap" appears elsewhere, we can scope to the map toolbar or layer switcher.
  // The layer switcher is likely a sidebar or panel.
  
  // Let's assume the dropdown options are list items.
  await page.getByText('OpenStreetMap').click();

  // Wait for the selection to settle
  // We can verify by checking the combobox value or by checking the map state if helpers were provided.
  // Since no helpers are provided, we verify the UI state.
  await expect(page.getByRole('combobox', { name: 'Basemaps' })).toHaveText(/OpenStreetMap/);
  
  // Alternatively, check if the combobox value is "OpenStreetMap"
  // Comboboxes might not have the value in the text content directly if it's a custom component.
  // Let's check if the combobox has the attribute or if the selected item is highlighted.
  
  // A more robust check for Chakra UI Combobox is to check the value attribute or the selected option.
  // However, expect(locator).toHaveText() often works for the visible text of the combobox.
  
  // Let's also verify that Carto Light is no longer the selected one if possible, 
  // but the primary assertion is that OpenStreetMap is selected.
});
