// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Precondition: Carto Light is active by default
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Step 1: The user opens the base map selector in the layer switcher.
  // The layer switcher is visible by default. We need to find the base map selector.
  // Based on typical Chakra UI structures, the layer switcher panel contains the base map options.
  // We look for the layer switcher panel and then interact with it.
  const layerSwitcherPanel = page.getByTestId('layer-switcher');
  await expect(layerSwitcherPanel).toBeVisible();

  // Step 2: The user selects 'OpenStreetMap' as the base map.
  // We need to find the radio button or button for OpenStreetMap within the layer switcher.
  // Assuming the base maps are presented as radio buttons or similar selectable items.
  // Using getByRole('radio') or getByRole('button') with the name 'OpenStreetMap' scoped to the panel.
  const osmOption = layerSwitcherPanel.getByRole('radio', { name: 'OpenStreetMap', exact: true }).or(
    layerSwitcherPanel.getByRole('button', { name: 'OpenStreetMap', exact: true })
  );
  
  // If the element is a Chakra radio, it might be hidden. Use force click if necessary.
  // However, let's first try to click it directly. If it's a radio, we might need to check its state.
  // Given the UI map doesn't specify exact roles for base map selectors, we try common patterns.
  // Let's assume they are radio buttons for base map selection.
  const osmRadio = layerSwitcherPanel.getByRole('radio', { name: 'OpenStreetMap' });
  
  // Check if it's already checked (it shouldn't be, as Carto Light is active)
  // If it's a Chakra radio, the input is visually hidden.
  await osmRadio.click({ force: true });

  // Expected results:
  // - The OpenStreetMap base map is selected.
  // - The Carto Light base map is no longer selected.
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');
});
