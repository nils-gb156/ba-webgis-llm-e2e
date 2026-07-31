// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initially verify Carto Light is active
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // Step 1: Open the base map selector in the layer switcher.
  // The layer switcher is visible by default. We need to find the base map selector.
  // Based on typical Chakra UI structures and the provided UI map, the layer switcher panel contains the base map options.
  // We look for a radio group or similar structure within the layer switcher for base maps.
  // Since specific test IDs for base map radio buttons aren't in the UI map, we use the layer switcher panel context.
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Identify the base map selection area. Often this is a RadioGroup.
  // We will look for "OpenStreetMap" text within the layer switcher to click it.
  // However, clicking text can be ambiguous. Let's try to find the radio button for OpenStreetMap.
  // If a specific radio button isn't available by role/name easily, we might need to look for the container.
  // Let's try getting the radio button by its accessible name "OpenStreetMap".
  const osmRadioButton = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap' });

  // Step 2: Select 'OpenStreetMap' as the base map.
  // Check if the radio button is already checked (it shouldn't be, as Carto Light is active).
  const isOsMChecked = await osmRadioButton.isChecked();
  if (!isOsMChecked) {
    await osmRadioButton.click();
  }

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
