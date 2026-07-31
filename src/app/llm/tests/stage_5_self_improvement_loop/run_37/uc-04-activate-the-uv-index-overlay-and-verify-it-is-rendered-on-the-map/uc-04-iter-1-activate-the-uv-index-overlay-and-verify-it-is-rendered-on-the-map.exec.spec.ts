// SPDX-FileCopyrightText: 2023-2025 Open Pioneer project (https://github.com/open-pioneer)
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from '../../../failure-snapshot-fixture';
import { isLayerRendered } from '../../../../map-model-helpers';

test('Use Case 4: Activate the UV-Index overlay and verify it is rendered on the map', async ({
    page,
}) => {
    await page.goto('http://localhost:5173/ba-webgis-llm-e2e/');

    // Wait for the map to be ready and confirm UV-Index is initially hidden
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(false);

    // Step 1: Click the visibility toggle of the UV-Index overlay layer
    // The Chakra UI checkbox control intercepts pointer events, so we must use force: true.
    // We scope the lookup to the "Operational layers" list to ensure we target the correct checkbox,
    // as "UV-Index" is a substring of "UV-Index Stations".
    const uvIndexCheckbox = page
        .getByRole('list', { name: 'Operational layers' })
        .getByRole('checkbox', { name: 'UV-Index', exact: true });
    await uvIndexCheckbox.click({ force: true });

    // Verify the toggle is now checked
    await expect(uvIndexCheckbox).toBeChecked();

    // Step 2: Wait for the map to load the layer tiles
    // The helper returns true only when the layer is actually rendered on the canvas
    await expect.poll(() => isLayerRendered(page, 'UV-Index Stations')).toBe(true);
});
