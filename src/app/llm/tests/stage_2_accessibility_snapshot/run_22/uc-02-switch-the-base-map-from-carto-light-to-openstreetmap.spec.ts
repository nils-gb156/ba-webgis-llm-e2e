// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '@playwright/test';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher toggle is already pressed (visible) by default.
  // The combobox "Basemaps" is the selector for the base map.
  const basemapSelector = page.getByRole('combobox', { name: 'Basemaps' });
  await basemapSelector.click();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We look for the list item containing "OpenStreetMap" inside the combobox or its dropdown.
  // Since the combobox might render a listbox or similar, we try to find the option.
  // Playwright's getByRole('combobox') click usually opens the dropdown.
  // We then look for the text "OpenStreetMap" within the page or a specific container.
  // Given the accessibility tree, it's likely a list item or option.
  // Let's try clicking the text "OpenStreetMap" if it appears, or use getByRole('option', { name: 'OpenStreetMap' }).
  // However, Chakra UI Combobox often uses a Listbox.
  
  // Try to select via role 'option' first, as it's more semantic for a combobox dropdown.
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(osmOption).toBeVisible();
  await osmOption.click();

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Verify the combobox now shows OpenStreetMap
  await expect(basemapSelector).toHaveValue('OpenStreetMap');
  
  // Alternatively, check if the selected item in the list is OpenStreetMap if the value isn't directly testable.
  // But typically, the combobox value updates. If the combobox is read-only or displays the selected item,
  // we might need to check the text inside the combobox.
  // Let's assert the visible text of the combobox if it acts as a display.
  // However, 'toHaveValue' is usually sufficient for input/combobox elements.
  // If the combobox is just a display, we might need getByText('OpenStreetMap').
  // Given the context "combobox "Basemaps": Carto Light", it likely updates its text/value.
  
  // Let's also verify that the map changes by checking for a map-related indicator if available,
  // but the prompt says map state is not in DOM. So we rely on the UI control state.
  
  // To be safe against Chakra's implementation, let's also check if the text "OpenStreetMap" is visible
  // in the vicinity of the selector or if the selector's text content changed.
  // But `toHaveValue` is the standard for inputs. If it's a custom component, `getByRole('combobox')`
  // usually maps to an input or a div with role=combobox.
  
  // If `toHaveValue` fails because it's a div, we can check the text.
  // Let's assume standard behavior first. If it's a Chakra Select/Combobox, it might be an input.
  
  // Re-evaluating based on "combobox "Basemaps": Carto Light". This suggests the accessible name is "Basemaps"
  // and the current value/display is "Carto Light".
  
  // Let's assert the combobox has the text "OpenStreetMap" if it's a display, or the value.
  // We'll use `expect(basemapSelector).toContainText('OpenStreetMap')` as a fallback or primary if it's a div.
  // But `toHaveValue` is better for inputs. Let's stick with `toHaveValue` if it's an input.
  // If it's a Chakra Combobox, it might render an input.
  
  // Let's try to be robust: check if the option is selected.
  // In many implementations, the selected option is marked.
  // But Playwright's `expect(osmOption).toBeVisible()` after click is a good sign.
  
  // Let's assert the combobox's accessible name or value reflects the change.
  // Since we can't easily check the "value" of a div-based combobox, let's check the text.
  // However, the prompt says "combobox "Basemaps": Carto Light". This format `role "name": value`
  // is typical for Playwright's accessibility tree inspection.
  
  // Let's assume the combobox input updates its value.
  await expect(basemapSelector).toHaveValue('OpenStreetMap');
});
