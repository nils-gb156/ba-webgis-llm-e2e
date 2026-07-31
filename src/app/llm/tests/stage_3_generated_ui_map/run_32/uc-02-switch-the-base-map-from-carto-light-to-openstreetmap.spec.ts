// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and verify initial state (Carto Light)
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // Open the base map selector in the layer switcher.
  // The layer switcher is visible by default. We look for a role that allows selecting a base map.
  // Often this is a radio group or a listbox. We'll try to find the base map selection area.
  // Based on typical Chakra UI / Pioneer patterns, the base map selector might be a set of radio buttons or a dropdown.
  // Let's look for the layer switcher panel first to scope our search.
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // Attempt to find the base map selector. It might be a radio group or a select.
  // If it's a radio group, we can find the radio button for OpenStreetMap.
  // Let's try to click on the layer switcher toggle if it's not already open, but the prompt says it's visible by default.
  // We need to find the control to switch base maps.
  // Common pattern: A radio group with legend "Base map" or similar.
  // Let's try to find a radio button or checkbox labeled "OpenStreetMap" within the layer switcher.
  
  // Since the exact UI structure for base map switching isn't explicitly detailed in the UI map with a specific testid for the selector,
  // we fall back to accessible names.
  // We assume there is a way to select "OpenStreetMap" as a base map.
  // Let's try to find a radio button or similar control.
  
  // If the base map selector is a radio group, we can look for the radio button.
  // Let's try to find the radio button for OpenStreetMap.
  const osmRadioButton = page.getByRole('radio', { name: 'OpenStreetMap' });
  
  // If it's not a radio button, it might be a checkbox or a list item.
  // Let's try clicking the OpenStreetMap option if it exists.
  if (await osmRadioButton.count() > 0) {
    await osmRadioButton.click();
  } else {
    // Fallback: Try to find a button or link with text "OpenStreetMap" inside the layer switcher
    const osmOption = layerSwitcher.getByRole('button', { name: 'OpenStreetMap' });
    if (await osmOption.count() > 0) {
      await osmOption.click();
    } else {
      // Last resort: Try to find a list item or div with text "OpenStreetMap"
      const osmItem = layerSwitcher.getByText('OpenStreetMap', { exact: true });
      if (await osmItem.count() > 0) {
        await osmItem.click();
      } else {
        // If we can't find it, we might need to open a submenu.
        // Let's assume there's a "Base map" section or toggle.
        const baseMapToggle = layerSwitcher.getByRole('button', { name: /Base map/i });
        if (await baseMapToggle.count() > 0) {
          await baseMapToggle.click();
          // After clicking, try to find the OpenStreetMap option again
          const osmOptionAfterToggle = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap' }).or(
            layerSwitcher.getByRole('option', { name: 'OpenStreetMap' })
          );
          if (await osmOptionAfterToggle.count() > 0) {
            await osmOptionAfterToggle.click();
          }
        }
      }
    }
  }

  // Verify that OpenStreetMap is now the active base map
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');

  // Verify that Carto Light is no longer the active base map
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.not.toBe('Carto Light');
});
