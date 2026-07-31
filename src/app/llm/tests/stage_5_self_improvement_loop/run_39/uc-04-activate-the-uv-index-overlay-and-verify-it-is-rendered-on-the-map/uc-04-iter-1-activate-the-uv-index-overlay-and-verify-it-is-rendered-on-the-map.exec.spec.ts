// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({ page }) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Step 1: Click the visibility toggle of the UV-Index overlay layer.
    // "UV-Index Stations" and "UV-Index" both contain "UV-Index" as a substring.
    // Use { exact: true } to target the correct checkbox.
    // Chakra UI checkbox requires force: true because the decorative overlay
    // intercepts pointer events.
    await page.getByRole('checkbox', { name: 'UV-Index', exact: true }).click({ force: true });

    // Verify the toggle is now checked.
    await expect(page.getByRole('checkbox', { name: 'UV-Index', exact: true })).toBeChecked();

    // Step 2: Wait for the map to load the layer tiles.
    // Step 2 Expected results: The UV-Index overlay tiles are rendered on the map canvas.
    await expect.poll(() => isLayerRendered(page, 'UV-Index')).toBe(true);
});
