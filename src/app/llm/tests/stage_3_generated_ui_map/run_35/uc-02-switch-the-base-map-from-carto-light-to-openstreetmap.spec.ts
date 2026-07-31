// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial base layer to be Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Open the layer switcher if it's not already visible (it is visible by default, but we ensure the panel is open)
  // The layer switcher is visible by default, so we just need to find the base map selector within it.
  // Based on the UI map, there is no explicit "base map selector" test id, but it is inside the layer-switcher panel.
  // We look for the OpenStreetMap option within the layer switcher.
  // Since we need to select it, we assume clicking the text "OpenStreetMap" inside the layer switcher works.
  // However, to be safe with Chakra UI and strict mode, we should look for the specific element.
  // The UI map doesn't list a specific test id for base map items. We will rely on text.
  // We scope the search to the layer switcher panel to avoid ambiguity.
  
  const layerSwitcher = page.getByTestId('layer-switcher');
  const osmOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap' });
  
  // If 'option' role is not used, fallback to button or text within the panel.
  // Assuming the base map selector uses a standard listbox/button pattern or similar.
  // Let's try clicking the text "OpenStreetMap" inside the layer switcher if it's a clickable element.
  // A more robust way for Chakra UI might be to look for a button or a list item.
  // Given the UI map doesn't specify, we try getByRole('button') or getByText('OpenStreetMap') scoped.
  
  // Let's assume there's a way to interact. Often base layers are toggled via buttons or list items.
  // We will try to find an element with text "OpenStreetMap" inside the layer switcher and click it.
  const osmElement = layerSwitcher.getByText('OpenStreetMap');
  await expect(osmElement).toBeVisible();
  await osmElement.click();

  // Verify the base layer has changed to OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
