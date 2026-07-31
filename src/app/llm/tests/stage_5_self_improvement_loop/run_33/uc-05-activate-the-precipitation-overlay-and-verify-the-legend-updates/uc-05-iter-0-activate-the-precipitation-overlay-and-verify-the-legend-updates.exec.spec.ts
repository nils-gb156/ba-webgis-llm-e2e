// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the Precipitation overlay layer
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Verify the Precipitation layer toggle is checked
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

    // Verify the Precipitation layer is actually rendered on the map
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: View the legend and verify it displays an entry for Precipitation
    // The legend panel is already visible. We look for a legend heading containing "Precipitation".
    await expect(page.getByRole('heading', { name: 'Precipitation' })).toBeVisible();
});
