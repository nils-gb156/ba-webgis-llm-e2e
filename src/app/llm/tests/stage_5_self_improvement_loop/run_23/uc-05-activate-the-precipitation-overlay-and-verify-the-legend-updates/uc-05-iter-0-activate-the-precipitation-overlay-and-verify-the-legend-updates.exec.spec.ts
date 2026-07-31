// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // 1. Click the visibility toggle of the Precipitation overlay layer to show it.
  await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

  // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
  await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

  // Verify the layer is rendered on the map via the helper.
  await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

  // 2. View the legend and verify it displays an entry corresponding to the Precipitation layer.
  // The legend panel is already visible. We assert that a legend entry for "Precipitation" appears.
  await expect(page.getByRole('heading', { name: 'Precipitation', level: 1 })).toBeVisible();
});
