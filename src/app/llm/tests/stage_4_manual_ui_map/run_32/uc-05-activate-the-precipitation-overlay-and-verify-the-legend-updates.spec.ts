// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({ page }) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. The user clicks the visibility toggle of the Precipitation overlay layer to show it.
  // The Precipitation layer is in the checkbox-list. We use force: true because Chakra UI
  // renders the real input visually hidden.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify the layer is actually rendered on the map (async operation)
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 2. The user views the legend.
  // Expected results:
  // - The Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // - The legend displays an entry corresponding to the Precipitation layer.
  // The legend panel is visible by default. We look for text inside the legend container.
  await expect(page.getByTestId('legend').getByText('Precipitation')).toBeVisible();
});
