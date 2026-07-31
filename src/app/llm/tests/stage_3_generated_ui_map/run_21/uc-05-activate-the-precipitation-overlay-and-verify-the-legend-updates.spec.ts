// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Step 1: Activate the Precipitation overlay
  // The Precipitation layer is initially hidden (false in UI map).
  // We need to find the checkbox for "Precipitation" in the layer switcher.
  // Using force: true because Chakra UI checkboxes have hidden inputs.
  const precipitationToggle = page
    .getByTestId('layer-switcher')
    .getByRole('checkbox', { name: 'Precipitation' });

  await expect(precipitationToggle).not.toBeChecked();
  await precipitationToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(precipitationToggle).toBeChecked();

  // Verify the layer is actually rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: Verify the legend updates
  // The legend should now display an entry for the Precipitation layer.
  // We look for the precipitation legend element which is listed in the UI map.
  await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
