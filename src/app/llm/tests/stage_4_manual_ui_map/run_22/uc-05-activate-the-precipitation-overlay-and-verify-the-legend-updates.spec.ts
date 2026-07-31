// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The layer switcher is visible by default. We locate the checkbox for "Precipitation".
  // Using force: true because Chakra UI renders the actual input visually hidden.
  const precipitationCheckbox = page.getByRole('checkbox', { name: 'Precipitation' });
  await precipitationCheckbox.click({ force: true });

  // 2. The user views the legend.
  // Expected result: The Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(precipitationCheckbox).toBeChecked();

  // Expected result: The legend displays an entry corresponding to the Precipitation layer.
  // We wait for the layer to be rendered on the map to ensure the data is loaded.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // Check that the legend is visible and contains content related to the Precipitation layer.
  const legend = page.getByTestId('legend');
  await expect(legend).toBeVisible();

  // The legend typically contains text or elements describing the active layers.
  // We assert that the legend contains the text "Precipitation" to verify it reflects the new layer.
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
