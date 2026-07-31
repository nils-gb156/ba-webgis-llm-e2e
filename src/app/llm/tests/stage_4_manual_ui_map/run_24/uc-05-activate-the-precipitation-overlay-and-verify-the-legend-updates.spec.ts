// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The Precipitation layer is in the operational layer checkbox list.
  // We use force: true because Chakra UI checkboxes have a visually hidden input.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify the layer is actually rendered on the map (async operation)
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the toggle is in the checked state
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // Step 2: The user views the legend.
  // Expected results: The legend displays an entry corresponding to the Precipitation layer.
  // The legend panel is visible by default.
  const legendLocator = page.getByTestId('legend');
  await expect(legendLocator).toBeVisible();

  // Check if the legend contains an entry for Precipitation.
  // Since the legend content is dynamic and rendered by the app, we look for text "Precipitation"
  // within the legend container.
  await expect(legendLocator.getByText('Precipitation')).toBeVisible();
});
