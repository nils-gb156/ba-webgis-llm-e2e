// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { getActiveBaseLayerTitle } from '../../../map-model-helpers';

test('Use Case 2: Switch the base map from Carto Light to OpenStreetMap', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and the initial base layer to be Carto Light
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('Carto Light');

  // Open the layer switcher if it is not already visible (it is visible by default, but ensure it)
  const layerSwitcher = page.getByTestId('layer-switcher');
  await expect(layerSwitcher).toBeVisible();

  // The layer switcher is visible by default. We need to find the base map selector.
  // Based on typical Chakra UI structures in Pioneer, the base layer selection might be inside the layer switcher.
  // We look for the OpenStreetMap option within the layer switcher.
  // Since we don't have a specific test id for the base map list items in the prompt, we use getByText.
  // We scope it to the layer switcher to avoid ambiguity.
  const osmOption = page.getByTestId('layer-switcher').getByText('OpenStreetMap', { exact: true });

  // Click the OpenStreetMap base map option
  await osmOption.click();

  // Assert that the active base layer is now OpenStreetMap
  await expect.poll(() => getActiveBaseLayerTitle(page)).toBe('OpenStreetMap');

  // Assert that Carto Light is no longer selected (implicitly covered by the above, but explicit check if needed)
  // Since only one base layer can be active, checking the title is sufficient.
});
