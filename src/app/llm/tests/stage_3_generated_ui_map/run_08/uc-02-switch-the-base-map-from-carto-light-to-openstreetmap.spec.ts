// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and verify initial state (Carto Light is active)
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher is visible by default. We need to find the base map selector.
  // Usually, this is a dropdown or a list within the layer switcher panel.
  // Looking at the UI map, we have `layer-switcher` panel and `layer-switcher-toggle`.
  // Since the layer switcher is already visible, we don't need to click the toggle.
  // We need to find the base map selector control.
  // Based on typical Chakra UI and Open Pioneer patterns, there might be a select or radio group.
  // Let's look for a selector within the layer switcher.
  // If there's no specific test id for the base map selector, we might need to interact with the layer switcher content.
  // However, often there is a specific control for base layers. Let's assume there is a select or similar.
  // If not explicitly listed, we might need to look for a role.
  // Let's try to find a select or combobox within the layer switcher.
  // Or perhaps the base layers are presented as radio buttons or a list.
  // Let's assume there is a `getByRole('combobox')` or `getByRole('listbox')` or similar inside the layer switcher.
  // If the UI map doesn't specify, we might have to guess based on common patterns.
  // Let's look for a `select` or `combobox` inside `layer-switcher`.
  
  // Attempting to find the base map selector.
  // Since the UI map doesn't explicitly list a "base map selector" test id, we'll look for a common pattern.
  // Often, base layers are selected via a dropdown or a set of radio buttons.
  // Let's try to click on the layer switcher panel to ensure it's focused, then look for the selector.
  // Actually, let's look for a `getByRole('combobox')` or `getByRole('listbox')` inside the layer switcher.
  
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Try to find a combobox or select for base layers
  const baseMapSelector = layerSwitcher.getByRole('combobox');
  
  // If combobox is not found, try a select
  const select = layerSwitcher.locator('select');
  
  // If neither, maybe it's a radio group or a list
  // Let's assume there is a combobox for base layers as it's a common pattern.
  if (await baseMapSelector.count() > 0) {
    await baseMapSelector.click();
    // Wait for the listbox to appear
    await expect(layerSwitcher.getByRole('option', { name: 'OpenStreetMap' })).toBeVisible();
    await layerSwitcher.getByRole('option', { name: 'OpenStreetMap' }).click();
  } else if (await select.count() > 0) {
    await select.selectOption('OpenStreetMap');
  } else {
    // Fallback: Try to find a button or link with "OpenStreetMap" inside the layer switcher
    // This is less likely but possible if it's a list of base maps
    const osmButton = layerSwitcher.getByText('OpenStreetMap', { exact: true });
    if (await osmButton.count() > 0) {
      await osmButton.click();
    } else {
      throw new Error('Could not find base map selector');
    }
  }

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // This step is combined with the interaction above.

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
