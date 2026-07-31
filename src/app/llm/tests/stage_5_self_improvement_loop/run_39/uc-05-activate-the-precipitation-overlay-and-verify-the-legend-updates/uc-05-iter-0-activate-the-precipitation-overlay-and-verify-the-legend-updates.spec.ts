// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '@playwright/test';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 5: Activate the Precipitation overlay and verify the legend updates', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Activate the Precipitation overlay by clicking its checkbox in the layer switcher.
    // Chakra UI checkboxes render the role-bearing <input> hidden; use force: true.
    await page.getByRole('checkbox', { name: 'Precipitation' }).click({ force: true });

    // Step 2: Verify the layer toggle is checked.
    await expect(
        page.getByRole('checkbox', { name: 'Precipitation' }),
    ).toBeChecked();

    // Verify the layer is actually rendered on the map.
    await expect.poll(() => isLayerRendered(page, 'Precipitation')).toBe(true);

    // Verify the legend displays an entry for the Precipitation layer.
    await expect(page.getByText('Precipitation', { exact: true })).toBeVisible();
});
