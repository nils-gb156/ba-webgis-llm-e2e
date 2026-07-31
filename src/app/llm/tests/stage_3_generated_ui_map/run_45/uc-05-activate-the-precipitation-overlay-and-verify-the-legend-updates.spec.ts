// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the visibility toggle of the Precipitation overlay layer.
  // The layer switcher is visible by default. We look for the checkbox associated with "Precipitation".
  // Using force: true because Chakra UI checkboxes render the input visually hidden.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationToggle.click({ force: true });

  // Step 2: Verify the Precipitation layer is rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Step 3: Verify the Precipitation overlay layer toggle is in the enabled (checked) state
  await expect(precipitationToggle).toBeChecked();

  // Step 4: Verify the legend displays an entry corresponding to the Precipitation layer
  // The UI map indicates a `precipitation-legend` element exists.
  await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
