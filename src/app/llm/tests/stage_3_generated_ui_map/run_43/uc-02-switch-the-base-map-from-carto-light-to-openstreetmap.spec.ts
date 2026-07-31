// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and Carto Light to be active initially
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // 1. Open the base map selector in the layer switcher.
  // The layer switcher is visible by default. We need to find the base map selector.
  // Based on typical Chakra UI / Pioneer patterns, this might be a radio group or similar inside the layer switcher.
  // Since no specific testid for the base map selector is listed, we look for the layer switcher panel content.
  // However, looking at the UI Map, we have `layer-switcher` panel and `layer-switcher-toggle` button.
  // The base map selection is usually inside the layer switcher.
  // Let's assume there is a way to select it. Often it's a radio group.
  // If no specific testid exists for the base map radio group, we might need to look for text.
  // But wait, the UI map doesn't list specific testids for the base map radio buttons.
  // Let's look for "OpenStreetMap" text or role.
  
  // The layer switcher is visible. We need to find the base map options.
  // Usually, base maps are in a specific section.
  // Let's try to click on the layer switcher if it's not already open (it is open by default).
  // We need to find the radio button or option for OpenStreetMap.
  
  // Since testids are not provided for the base map options, we use getByRole or getByText.
  // We need to scope this to the layer switcher to avoid ambiguity.
  const layerSwitcher = page.getByRole('panel', { name: 'Layer Switcher' }).or(page.getByTestId('layer-switcher'));
  
  // Try to find the base map selector. It might be a radio group.
  // We look for the radio button with name "OpenStreetMap".
  const osmRadio = layerSwitcher.getByRole('radio', { name: 'OpenStreetMap' });
  
  // If the radio button exists, click it.
  // If it doesn't exist, we might need to look for a different pattern.
  // However, standard Pioneer LayerSwitcher uses radio buttons for base maps.
  await expect(osmRadio).toBeVisible();
  await osmRadio.click();

  // 2. Verify that OpenStreetMap is now the active base map.
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
