// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is visible by default. We look for the Precipitation layer item.
  const precipitationLayerItem = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationLayerItem).toBeVisible();
  
  // Click the checkbox to enable the layer
  await precipitationLayerItem.click();

  // Step 2: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationLayerItem).toBeChecked();

  // Verify the layer is actually rendered on the map (asynchronous network request for tiles)
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer
  // The legend should update to show the Precipitation legend.
  // We look for the precipitation-legend element which is listed in the UI map.
  const precipitationLegend = page.getByTestId('precipitation-legend');
  await expect(precipitationLegend).toBeVisible();
});
