// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to load
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the visibility toggle of the Precipitation overlay layer.
  // The Precipitation layer is initially hidden (visible by default: false).
  // We need to find the checkbox/switch for "Precipitation" in the layer switcher.
  // Based on the UI map, the layer switcher is visible by default.
  // We look for a checkbox within the layer-switcher panel with the text "Precipitation".
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' }).first();
  await precipitationToggle.click({ force: true });

  // Step 2: Verify the Precipitation overlay is rendered on the map.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the toggle is in the enabled (checked) state.
  await expect(precipitationToggle).toBeChecked();

  // Step 3: Verify the legend displays an entry corresponding to the Precipitation layer.
  // The legend is visible by default. We look for the precipitation legend element.
  await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
