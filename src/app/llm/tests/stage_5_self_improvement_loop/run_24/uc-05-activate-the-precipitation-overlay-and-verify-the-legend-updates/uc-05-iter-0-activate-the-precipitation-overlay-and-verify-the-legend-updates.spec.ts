// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the visibility toggle of the Precipitation overlay layer to show it.
  // The checkbox is a Chakra UI control, so we use force: true to bypass the decorative overlay.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // 2. Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // 3. Verify the layer is actually rendered on the map.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 4. View the legend and verify it displays an entry corresponding to the Precipitation layer.
  const legend = page.getByTestId('legend');
  await expect(legend.getByText('Precipitation')).toBeVisible();
});
