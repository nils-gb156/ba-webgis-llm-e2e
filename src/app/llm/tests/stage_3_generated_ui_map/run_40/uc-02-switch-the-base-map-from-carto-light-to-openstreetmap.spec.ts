// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map model to be ready and verify initial state (Carto Light)
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('Carto Light');

  // The layer switcher is visible by default.
  // Open the base map selector within the layer switcher.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const baseMapSelectorToggle = layerSwitcher.getByRole('button', { name: 'Base map' });
  await baseMapSelectorToggle.click();

  // Select 'OpenStreetMap' from the base map options.
  // We use exact name matching to distinguish from other potential buttons.
  const openStreetMapOption = layerSwitcher.getByRole('option', { name: 'OpenStreetMap', exact: true });
  await openStreetMapOption.click();

  // Assert that the active base layer has changed to OpenStreetMap.
  await expect.poll(() => getActiveBaseLayerTitle(page)).resolves.toBe('OpenStreetMap');
});
