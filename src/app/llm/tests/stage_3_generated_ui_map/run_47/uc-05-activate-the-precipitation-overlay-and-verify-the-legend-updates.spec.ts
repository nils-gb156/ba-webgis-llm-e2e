// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect(page.getByTestId('map-container')).toBeVisible();
  await expect(page.getByTestId('layer-switcher')).toBeVisible();
  await expect(page.getByTestId('legend')).toBeVisible();

  // Click the visibility toggle for the Precipitation layer in the layer switcher.
  // The layer switcher is visible by default. We look for the checkbox associated with "Precipitation".
  // Since Chakra UI checkboxes have the input visually hidden, we use force: true.
  const precipToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipToggle).toBeChecked({ checked: false }); // Verify it is initially unchecked
  await precipToggle.click({ force: true });

  // Verify the toggle is now checked
  await expect(precipToggle).toBeChecked();

  // Verify the layer is actually rendered on the map via the helper
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the legend updates to show the Precipitation entry
  // The legend element should contain text or an entry related to Precipitation
  // Based on the UI map, there is a `precipitation-legend` element
  await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
