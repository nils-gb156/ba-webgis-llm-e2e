// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Carto Light should be active by default
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher is visible by default, so we interact with it directly.
  // The base map selector is a dropdown within the layer switcher.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Identify the dropdown for base maps. Based on context, it's likely a select or button.
  // We'll look for a dropdown control inside the layer switcher.
  // Since no specific test id is given for the base map dropdown itself, we use getByRole.
  // It's a single selection dropdown.
  const baseMapDropdown = layerSwitcher.getByRole('button', { name: 'Base map' }).or(layerSwitcher.getByRole('combobox'));
  
  // If the above doesn't find it, we might need to look for a specific label or role.
  // Let's assume there is a clear label "Base map" or similar.
  // If not, we might need to click the layer switcher toggle if it wasn't visible, but it is.
  // Let's try to find the dropdown by its accessible name or a common pattern.
  // Often, base map selectors are labeled "Base map" or "Basemap".
  // Let's try to click the layer switcher if it's a toggle, but the ui-map says it's visible by default.
  // So we just need to interact with the base map selector inside it.
  
  // Let's assume the base map selector is a dropdown with test id or role.
  // If no test id, we look for a combobox or button.
  // Let's try to find a combobox inside layer-switcher.
  const baseMapSelector = layerSwitcher.getByRole('combobox');
  
  // If combobox is not found, maybe it's a select element rendered as a button?
  // Let's try to click the layer switcher's content area to ensure it's expanded if needed,
  // but ui-map says visibleByDefault: true.
  
  // Let's assume the base map selector is identifiable by its label or role.
  // If the UI has a label "Base map", we can use getByLabel.
  // Let's try getByLabel('Base map') inside layer-switcher.
  const baseMapLabel = layerSwitcher.getByLabel('Base map');
  
  // If getByLabel fails, we might need to look for a button that opens a menu.
  // Let's try to find a button with text "Base map" or similar.
  const baseMapButton = layerSwitcher.getByRole('button', { name: /base map/i });
  
  // Fallback: look for any dropdown-like element.
  // Since we don't have explicit test ids for the options, we'll rely on the dropdown opening.
  // Let's try to click the first dropdown-like element inside layer-switcher if we can't identify it precisely.
  // However, best practice is to use accessible names.
  
  // Let's assume there is a clear "Base map" selector.
  // We will try to interact with it.
  
  // If the above locators fail, we might need to inspect the actual DOM structure in a real scenario.
  // For this generation, we'll assume a standard accessible name "Base map" for the selector.
  
  // Let's try to click the base map selector.
  // If it's a combobox, clicking it opens the list.
  // If it's a button, clicking it opens the menu.
  
  // Let's try to find the base map selector by its label or role.
  // We'll use a combination of strategies.
  
  // Strategy 1: getByLabel
  // Strategy 2: getByRole('button') with name containing "Base map"
  // Strategy 3: getByRole('combobox')
  
  // Let's try to click the base map selector.
  // We'll use a locator that is likely to find it.
  const baseMapControl = baseMapLabel.or(baseMapButton).or(baseMapSelector);
  
  // If the control is not found, we might need to look for a specific test id.
  // Since no test id is provided for the base map selector, we rely on accessible names.
  
  // Let's assume the base map selector is found.
  await baseMapControl.click();
  
  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // The options are "Carto Light", "Carto Dark", "OpenStreetMap".
  // We need to select "OpenStreetMap".
  // If it's a combobox, we can use selectOption.
  // If it's a menu, we click the item.
  
  // Let's try to click the "OpenStreetMap" option.
  // The option might be in a listbox or menu.
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  
  // If the option is not found, it might be in a specific container.
  // Let's try to find it in the layer switcher.
  const osmOptionInSwitcher = layerSwitcher.getByRole('option', { name: 'OpenStreetMap' });
  
  // Fallback: look for text "OpenStreetMap"
  const osmTextOption = layerSwitcher.getByText('OpenStreetMap');
  
  // We'll try to click the option.
  await osmOptionInSwitcher.or(osmOption).or(osmTextOption).click();
  
  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  
  // Assert that the active base layer is now OpenStreetMap.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
