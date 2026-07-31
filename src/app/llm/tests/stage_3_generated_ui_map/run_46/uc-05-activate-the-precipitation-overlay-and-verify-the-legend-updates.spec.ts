// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to settle
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The Precipitation layer is initially hidden (visible by default: false).
  // We click the checkbox associated with the Precipitation layer in the layer switcher.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation', exact: true });
  await precipitationToggle.click();

  // Verify the layer is actually rendered on the map via the helper
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: The user views the legend.
  // Expected results: The legend displays an entry corresponding to the Precipitation layer.
  // We assert that the precipitation legend element is visible.
  await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
