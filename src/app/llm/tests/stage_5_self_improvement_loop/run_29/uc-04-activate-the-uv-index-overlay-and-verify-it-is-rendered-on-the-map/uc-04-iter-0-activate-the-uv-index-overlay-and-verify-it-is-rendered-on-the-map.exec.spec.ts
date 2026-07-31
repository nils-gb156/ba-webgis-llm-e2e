// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready before interacting
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBeFalsy();

    // Step 1: Click the visibility toggle of the UV-Index overlay layer
    // The checkbox is visually hidden behind the Chakra control, so we use force: true
    await page.getByRole('checkbox', { name: 'UV-Index' }).click({ force: true });

    // Step 2: Wait for the map to load the layer tiles
    // Step 2: Verify the UV-Index overlay layer toggle is in the enabled (checked) state
    await expect(page.getByRole('checkbox', { name: 'UV-Index' })).toBeChecked();

    // Step 2: Verify the UV-Index overlay tiles are rendered on the map canvas
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
