// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Verify initial state: Carto Light should be active
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // Locate the layer switcher toggle and ensure it is open
  const layerSwitcherToggle = page.getByTestId('layer-switcher-toggle');
  const layerSwitcher = page.getByTestId('layer-switcher');

  // Check current state of the toggle to avoid closing an already open panel
  const isTogglePressed = await layerSwitcherToggle.getAttribute('aria-pressed');
  if (isTogglePressed !== 'true') {
    await layerSwitcherToggle.click();
  }

  // Wait for the layer switcher panel to be visible
  await expect(layerSwitcher).toBeVisible();

  // Select OpenStreetMap from the base map dropdown
  // The UI map indicates a dropdown for basemaps. We look for a select or button group.
  // Assuming standard Chakra UI Select or similar dropdown pattern within the layer switcher.
  // Since specific test IDs for dropdown options aren't provided, we use getByRole with exact name.
  const osmOption = page.getByRole('option', { name: 'OpenStreetMap' });
  await expect(osmOption).toBeVisible();
  await osmOption.click();

  // Verify the base map has switched to OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
