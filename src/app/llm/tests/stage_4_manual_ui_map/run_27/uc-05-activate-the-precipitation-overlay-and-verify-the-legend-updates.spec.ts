// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Wait for the map and initial layers to be ready
  await expect.poll(() => isLayerRendered(page, 'Temperature')).toBe(true);

  // Step 1: The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The Precipitation layer is not in the default list, so it should be unchecked initially.
  // We use force: true because Chakra UI checkbox controls have a hidden input.
  const precipitationToggle = page.getByRole('checkbox', { name: 'Precipitation' });
  await expect(precipitationToggle).toBeChecked({ checked: false });
  await precipitationToggle.click({ force: true });

  // Step 2: The user views the legend.
  // Expected result 1: The Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationToggle).toBeChecked({ checked: true });

  // Expected result 2: The legend displays an entry corresponding to the Precipitation layer.
  // We also verify via map model that the layer is actually rendered.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Check that the legend contains the Precipitation entry.
  // The legend is inside the layer-switcher panel.
  const legend = page.getByTestId('legend');
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
