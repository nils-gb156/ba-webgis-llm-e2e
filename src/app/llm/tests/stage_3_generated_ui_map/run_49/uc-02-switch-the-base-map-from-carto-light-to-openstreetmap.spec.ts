// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and verify initial state
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Open the base map selector in the layer switcher
  // The layer switcher is visible by default, and the layer-switcher-toggle
  // is likely already "active" or the panel is open. We look for the base map
  // selection controls inside the layer switcher panel.
  const layerSwitcher = page.getByRole('panel', { name: 'Layer Switcher' });
  await expect(layerSwitcher).toBeVisible();

  // Locate the base map selector within the layer switcher.
  // Typically, base maps are listed with radio-like controls or clickable items.
  // We look for the OpenStreetMap option.
  const osmOption = layerSwitcher.getByRole('button', { name: 'OpenStreetMap' }).first();
  
  // If the option is not visible, we might need to expand a section or ensure the switcher is fully loaded.
  // However, given the layer switcher is visible by default, we assume the base maps are accessible.
  // We click the OpenStreetMap option to select it.
  await osmOption.click();

  // Verify that OpenStreetMap is now the active base layer
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

  // Verify that Carto Light is no longer the active base layer
  await expect.poll(() => getActiveBaseLayerTitle(page)).not.toBe('Carto Light');
});
