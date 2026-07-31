// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('UC5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and UI to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();

  // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The layer switcher is visible by default. We look for the checkbox with the label "Precipitation".
  // Using force: true because Chakra UI renders the input visually hidden.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).toBeVisible();
  await precipitationToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(precipitationToggle).toBeChecked();

  // Verify the layer is actually rendered on the map via the helper
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: The user views the legend.
  // The legend is visible by default.
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Expected result: The legend displays an entry corresponding to the Precipitation layer.
  // We assert that the legend contains text related to "Precipitation".
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
