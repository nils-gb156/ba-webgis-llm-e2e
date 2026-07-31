// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to render
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Activate the Precipitation overlay
  // The Precipitation layer is initially hidden (visible by default: false).
  // We click the toggle in the layer switcher.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await precipitationToggle.click();

  // Verify the toggle is now checked
  await expect(precipitationToggle).toBeChecked();

  // Verify the layer is actually rendered on the map via the helper
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: Verify the legend updates
  // The legend should display an entry corresponding to the Precipitation layer.
  // Based on the UI map, 'precipitation-legend' is the specific element for this.
  const precipitationLegend = page.getByTestId('precipitation-legend');
  await expect(precipitationLegend).toBeVisible();
});
