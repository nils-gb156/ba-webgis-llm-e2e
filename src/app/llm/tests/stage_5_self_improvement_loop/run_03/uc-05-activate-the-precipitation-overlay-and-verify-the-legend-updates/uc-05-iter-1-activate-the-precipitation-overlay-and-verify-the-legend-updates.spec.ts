// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the Precipitation overlay layer to show it.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Verify the Precipitation overlay layer toggle is in the enabled (checked) state.
    await expect(page.getByRole('checkbox', { name: 'Precipitation' })).toBeChecked();

    // Verify the layer is actually rendered on the map.
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Step 2: View the legend and verify it displays an entry corresponding to the Precipitation layer.
    await expect(page.getByTestId('precipitation-legend')).toBeVisible();
});
