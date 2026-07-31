// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Carto Light is active by default
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Step 1: Open the base map selector in the layer switcher
  // The layer switcher is visible by default, so we just need to find the dropdown.
  // Based on the UI map, the layer switcher contains the basemaps control.
  // We look for the dropdown within the layer-switcher panel.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Locate the basemap dropdown. Since there isn't a specific testid for the dropdown itself,
  // we look for a select or a role associated with base map selection.
  // Often, dropdowns are rendered as buttons or selects. Let's try to find a button or select
  // within the layer switcher that might represent the base map selection.
  // If the UI uses a Chakra Select, it might have a button role.
  // Let's assume there is a visible label or text like "Base map" or similar.
  // However, without a specific testid, we might need to rely on the structure.
  // Let's look for a dropdown-like element.
  
  // If the layer switcher is a panel, the basemap selector might be a specific component.
  // Let's try to click on the layer switcher if it's collapsible, but the UI map says it's visibleByDefault.
  // The UI map mentions "basemaps" with controlType "dropdown".
  // Let's assume there is a button or select that opens the dropdown.
  // Since we don't have a testid, we might need to use getByRole or getByText.
  // Let's try to find a button or select within the layer-switcher.
  
  // Alternative: The layer switcher might have a specific header or title.
  // Let's try to find the dropdown by its context.
  
  // If the dropdown is not directly clickable, we might need to click a toggle.
  // But the UI map doesn't mention a toggle for the layer switcher itself, only for the panel.
  // The layer-switcher-toggle button toggles the visibility of the layer-switcher panel.
  // Since it's visible by default, we don't need to toggle it.
  
  // Let's look for the basemap dropdown. It might be a Chakra Select.
  // We can try to find a select element or a button that acts as a select.
  
  // Let's try to find the dropdown by looking for a button or select within the layer-switcher.
  // If there's no clear testid, we might need to use a more generic locator.
  
  // Let's assume the dropdown is represented by a button with an accessible name like "Base map" or similar.
  // Or it might be a select element.
  
  // Let's try to click on the layer switcher area to see if it reveals the dropdown, or if the dropdown is always visible.
  // The UI map says the layer switcher is visible by default.
  
  // Let's try to find the basemap dropdown.
  // If we can't find it by role or text, we might need to use a CSS selector as a last resort.
  
  // Let's try to find a button or select within the layer-switcher.
  const basemapDropdown = layerSwitcher.locator('button, select').first();
  
  // If the dropdown is not found, we might need to look for a specific component.
  // Let's try to click the dropdown if it exists.
  if (await basemapDropdown.isVisible()) {
    await basemapDropdown.click();
  } else {
    // If the dropdown is not directly clickable, we might need to look for a different element.
    // Let's try to find a button or link that opens the basemap selection.
    // This part is tricky without more specific UI details.
    // Let's assume there is a button labeled "Base map" or similar.
    const basemapButton = layerSwitcher.getByRole('button', { name: /base map/i });
    if (await basemapButton.isVisible()) {
      await basemapButton.click();
    } else {
      // Fallback: Try to find any button or select in the layer switcher
      await layerSwitcher.locator('button').first().click();
    }
  }

  // Step 2: Select 'OpenStreetMap' as the base map
  // After clicking the dropdown, the options should be visible.
  // Let's look for the 'OpenStreetMap' option.
  const osmOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap' });
  if (await osmOption.isVisible()) {
    await osmOption.click();
  } else {
    // If the option is not found by role, try by text
    const osmOptionByText = layerSwitcher.getByText('OpenStreetMap');
    if (await osmOptionByText.isVisible()) {
      await osmOptionByText.click();
    } else {
      // Fallback: Try to find the option by any means
      await layerSwitcher.getByText('OpenStreetMap').click();
    }
  }

  // Expected results: The OpenStreetMap base map is selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
