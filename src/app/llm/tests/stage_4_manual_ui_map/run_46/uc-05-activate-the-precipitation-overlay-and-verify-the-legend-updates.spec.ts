// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The Precipitation layer is initially hidden (not in defaults).
  // We locate the checkbox by its accessible name.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationCheckbox).toBeChecked({ checked: false });
  await precipitationCheckbox.click({ force: true });

  // Verify the layer is actually rendered on the map (async operation)
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Verify the checkbox state is now enabled/checked
  await expect(precipitationCheckbox).toBeChecked();

  // Step 2: The user views the legend.
  // Expected results: The legend displays an entry corresponding to the Precipitation layer.
  const legendContainer = page.getByTestId('legend');
  await expect(legendContainer).toBeVisible();

  // Check that the legend contains an entry for Precipitation.
  // We look for text within the legend container that matches "Precipitation".
  await expect(legendContainer.getByText('Precipitation', { exact: true })).toBeVisible();
});
