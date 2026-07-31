// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initially show Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Open the layer switcher if it's not already visible (it is by default, but ensure it's open)
  // The layer switcher is visible by default, so we can directly interact with it.
  // However, we need to find the base map selector within the layer switcher.
  // Based on typical Chakra UI structures and the provided UI map, the layer switcher panel is visible.
  // We need to locate the base map selector. Since no specific test id for the base map selector is given,
  // we look for a role or text within the layer-switcher panel.
  // The layer switcher panel is 'layer-switcher'.
  // We look for a button or option that says "OpenStreetMap" or a base map list.
  // Let's assume there's a way to select the base map. Often this is a list or a set of radio buttons.
  // Without explicit test IDs for the base map options, we might need to use getByText or getByRole.
  // Let's look for "OpenStreetMap" text within the layer switcher.
  
  const layerSwitcher = page.getByTestId('layer-switcher');
  
  // Attempt to find the base map selector. It might be a group of radio buttons or a list.
  // Let's try to click on a button that might open the base map list if it's not directly visible.
  // Or, if the base maps are listed directly, we click on "OpenStreetMap".
  
  // Since the prompt doesn't specify the exact UI for base map switching, we infer from "layer switcher".
  // Let's assume there is a visible list or button for base maps.
  // We will look for "OpenStreetMap" within the layer switcher panel.
  
  const osmOption = layerSwitcher.getByText('OpenStreetMap', { exact: true });
  
  // If the option is not immediately visible, it might be inside a collapsed section.
  // However, the layer switcher is visible by default.
  // Let's try clicking the OS M option. If it's a radio button, we might need to use force: true if it's wrapped.
  
  // Check if the option is visible
  await expect(osmOption).toBeVisible();
  
  // Click the OpenStreetMap option
  await osmOption.click();
  
  // Verify that OpenStreetMap is now the active base layer
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
