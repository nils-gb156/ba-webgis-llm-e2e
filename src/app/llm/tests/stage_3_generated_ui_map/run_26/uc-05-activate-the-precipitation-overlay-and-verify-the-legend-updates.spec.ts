// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and layer switcher to be ready
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is visible by default. We look for the Precipitation layer item.
  // Since we don't have specific test ids for individual layer items in the prompt's UI map,
  // we use getByRole with the layer name. We assume the layer switcher panel scopes the search.
  const layerSwitcher = page.getByTestId('layer-switcher');
  const precipitationToggle = layerSwitcher.getByRole('checkbox', { name: 'Precipitation', exact: true });

  // Ensure the toggle is clickable (force true for Chakra UI checkbox if needed)
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Verify the layer is actually rendered on the map via the helper
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: View the legend
  // The legend is visible by default. We check if it displays an entry corresponding to the Precipitation layer.
  // Based on the UI map, there is a specific legend element for precipitation: `precipitation-legend`
  const precipitationLegend = page.getByTestId('precipitation-legend');
  
  // Wait for the precipitation legend to be visible, indicating the legend has updated to reflect the active layer
  await expect(precipitationLegend).toBeVisible();
});
