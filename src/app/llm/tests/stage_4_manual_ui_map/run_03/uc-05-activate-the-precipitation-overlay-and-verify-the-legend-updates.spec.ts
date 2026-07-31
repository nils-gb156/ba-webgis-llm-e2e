// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The layer switcher is visible by default. We locate the checkbox for "Precipitation".
  // Using force: true because Chakra UI checkbox inputs are visually hidden.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationToggle.click({ force: true });

  // Verify the toggle is checked
  await expect(precipitationToggle).toBeChecked();

  // Verify the layer is actually rendered on the map (asynchronous operation)
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 2: The user views the legend.
  // The legend is visible by default. We assert that it contains an entry for the Precipitation layer.
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // Check if the legend displays an entry corresponding to the Precipitation layer.
  // We look for text within the legend that matches the layer name.
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
