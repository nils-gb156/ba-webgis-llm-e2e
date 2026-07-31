// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
  page,
}) => {
  await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

  // Step 1: Activate the Precipitation overlay
  await page.getByRole('checkbox', { name: 'Precipitation', exact: true }).click({ force: true });

  // Verify the checkbox is now checked
  await expect(
    page.getByRole('checkbox', { name: 'Precipitation', exact: true })
  ).toBeChecked();

  // Verify the layer is actually rendered on the map
  await expect(
    poll(() => isLayerRendered(page, 'Precipitation'))
  ).toBe(true);

  // Step 2: View the legend and verify it displays an entry for Precipitation
  await expect(
    page.getByRole('heading', { name: 'Precipitation', level: 1 })
  ).toBeVisible();
});

function poll<T>(callback: () => T | Promise<T>) {
  return expect.poll(callback);
}
