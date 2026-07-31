// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The layer switcher is visible by default. We target the checkbox for "Precipitation".
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click();

  // Step 2: The user views the legend.
  // We verify the map state first to ensure the layer is actually rendered.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Expected result: The Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Expected result: The legend displays an entry corresponding to the Precipitation layer.
  // We assert that the legend panel is visible and contains text related to "Precipitation".
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();
  await expect(legend.getByText('Precipitation', { exact: false })).toBeVisible();
});
