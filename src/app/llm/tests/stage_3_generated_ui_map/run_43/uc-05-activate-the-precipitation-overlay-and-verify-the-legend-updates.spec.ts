// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map to be ready and initial layers to settle
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: Click the visibility toggle of the Precipitation overlay layer
  // The layer switcher is visible by default. We look for the checkbox associated with "Precipitation".
  // Using force: true because Chakra UI renders the input visually hidden.
  const precipitationToggle = page
    .getByRole('checkbox', { name: 'Precipitation' })
    .first();
  await precipitationToggle.click({ force: true });

  // Verify the Precipitation layer is now rendered on the map
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the toggle is in the checked state
  await expect(precipitationToggle).toBeChecked();

  // Step 2: View the legend and verify it reflects the newly active layer
  // The legend is visible by default. We check for an entry corresponding to Precipitation.
  // Based on the UI map, there is a `precipitation-legend` element.
  await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
