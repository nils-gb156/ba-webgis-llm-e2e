// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The layer switcher is visible by default. We locate the checkbox for "Precipitation".
  // Using force: true because Chakra UI checkboxes render the input visually hidden.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify the layer is actually rendered on the map (map state is not in DOM)
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the toggle is in the enabled (checked) state
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // Step 2: The user views the legend.
  // The legend is visible by default. We assert it contains an entry for Precipitation.
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();
  
  // The legend should display an entry corresponding to the Precipitation layer.
  // We look for text "Precipitation" within the legend container.
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
